import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ENV } from 'config/env';
import { RecursiveCharacterTextSplitter , TokenTextSplitter} from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import * as pLimit from 'p-limit';

@Injectable()
export class LlmService {

    private readonly qdrantURL = ENV.QDRANT_URL
    private readonly qdrantAPIKEY = ENV.QDRANT_API_KEY
    private readonly limit = pLimit(1)
    
    private readonly client = new QdrantClient({
      url: this.qdrantURL,
      apiKey: this.qdrantAPIKEY,
      port : undefined,
    });
    
    private readonly clientGPT = new OpenAI()

    async embedding( prompt: string) {
        let specificPrompt = ""
        switch (prompt) {
            case "pdf" : {
                specificPrompt = `You are helpful pdf praser, please reade attach pdf document carefully, not paraphase, not change content.
                                Truth full content
                                If content is media : images, equations. Short desribe about images. Use Latex format with equations
                                Output will be : {
                                 prase : prase content at markdown format,
                                } `
            }
        }
        return specificPrompt
    }

    async langchainChunk(praseData : string ) {
        
        // const splitter = new RecursiveCharacterTextSplitter({
        //     chunkSize : 500,
        //     chunkOverlap : 100,

        // })
        const splitter = new TokenTextSplitter({
            encodingName: 'cl100k_base', // tương thích với Gemini & OpenAI
            chunkSize: 256,              // số token mỗi chunk
            chunkOverlap: 20,            // số token chồng lặp giữa các chunk
          });
        return await splitter.splitText(praseData)
    }
    
    // async geminiEmbedding(chunks: string[]) {
    //     const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
    
    //     const embeddings: number[][] = [];
    
    //     for (const chunk of chunks) {
    //         const response = await ai.models.embedContent({
    //             model: 'gemini-embedding-exp-03-07',
    //             contents: chunk,
    //         });
    //         if (response.embeddings?.[0]?.values) {
    //             embeddings.push(response.embeddings[0].values);
    //         }
    //         // Nếu cần delay giữa các request, thêm sleep vào đây
    //         await new Promise(resolve => setTimeout(resolve, 5000)); // 100ms delay
    //     }
    
    //     return embeddings;
    // }
    async geminiChuckEmbedding(
      chunk : string, 
      retries = 3, 
      delay = 5000 ):Promise<any> {
        try {
            const ai = new GoogleGenAI({apiKey: ENV.GEMINI_API_KEY})
            const response = await ai.models.embedContent({
                model: 'gemini-embedding-exp-03-07',
                contents: chunk,
            })
            return response.embeddings?.[0].values
        } catch (error: any) {
            const message = error?.message || '';
            const isRateLimit = message.includes('429') || message.includes('rate limit');
        
            if (isRateLimit && retries > 0) {
                console.warn(`Rate limited. Retrying after ${delay}ms...`);
                await new Promise((res) => setTimeout(res, delay));
                return this.geminiChuckEmbedding(chunk, retries - 1, delay * 2);
            }
            throw error
        }
    }

    async geminiEmbedding(chunks : string[]) {
        const response = await Promise.all(
            chunks.map(chunk => 
              this.limit(() => this.geminiChuckEmbedding(chunk))
            )
          );
        return response
        // return respone
        // const ai = new GoogleGenAI({ apiKey : ENV.GEMINI_API_KEY})
        // const respone = await ai.models.embedContent({
        //     model: 'gemini-embedding-exp-03-07',
        //     contents: parseData,
        // })
        // return respone.embeddings?.[0].values

    }

    

    // async gptEmbedding(praseData : string ) {

    // }

    async storeEmbedding(
      chunk: any,
      vectors : any,
      userID : string, 
      collectionName : string, 
      spaceID : string, 
      fileID: string) {
        const promises = vectors.map((vec, idx) => 
            this.client.upsert(collectionName, {
              points: [
                {
                  id: uuidv4(),
                  vector: vec,
                  payload: {
                    text : chunk[idx],
                    spaceID: spaceID,
                    userID: userID,
                    fileID: fileID,
                    chunkIndex: idx,
                  }
                }
              ]
            })
          );
        // const promises = chunk.map((text,index) => {
        //   this.client.upsert(collectionName, {
        //     points: [
        //       {
        //         id : uuidv4(),
        //         vector : vectors[index],
        //         payload: {
        //           text : text,
        //           spaceID: spaceID,
        //           userID: userID,
        //           fileID: fileID,
        //           chunkIndex: index,
        //         }
        //       }
        //     ]
        //   })
        // })
        const data = await Promise.all(promises);
        return data
    }
    
    // userID, spaceID, fileID, collectionName, vector
    async queryEmbedding(
      vector : number[],
      userID: string, 
      spaceID: string, 
      fileID : string, 
      collectionName: string) {
        const result = await this.client.search(collectionName, {
            vector : vector,
            limit : 5,
            filter : {
              must : [
                { key : "userID", match : { value : userID}},
                { key : "spaceID", match : { value : spaceID }},
                { key : "fileID", match : { value : fileID}},
              ]
            },
            with_payload : true,
            with_vector : true,
        })
        // console.log(result)
        return result
    }


    async moderationGPT(content : string) {
        const moderation = await this.clientGPT.moderations.create({
            model: "omni-moderation-2024-09-26",
            input: content,
        })
        return moderation
    }
}
