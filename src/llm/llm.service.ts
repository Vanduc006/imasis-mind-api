import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ENV } from 'config/env';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LlmService {

    private readonly qdrantURL = ENV.QDRANT_URL
    private readonly qdrantAPIKEY = ENV.QDRANT_API_KEY
    
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
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize : 500,
            chunkOverlap : 100,

        })
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
    

    async geminiEmbedding(parseData : string) {
        const ai = new GoogleGenAI({ apiKey : ENV.GEMINI_API_KEY})
        const respone = await ai.models.embedContent({
            model: 'gemini-embedding-exp-03-07',
            contents: parseData,
        })
        return respone.embeddings?.[0].values
    }

    

    // async gptEmbedding(praseData : string ) {

    // }

    async storeEmbedding(vector : any,userID : string, collectionName : string, spaceID : string, fileID: string) {
        const promises = vector.map((vec, idx) => 
            this.client.upsert(collectionName, {
              points: [
                {
                  id: uuidv4(),
                  vector: vec,
                  payload: {
                    spaceID: spaceID,
                    userID: userID,
                    fileID: fileID,
                    chunkIndex: idx,
                  }
                }
              ]
            })
          );

        const data = await Promise.all(promises);
        return data
    }
    
    // userID, spaceID, fileID, collectionName, vector
    async queryEmbedding(vector : number[],UserID: string, spaceID: string, fileID : string, collectionName: string) {
        const result = await this.client.search(collectionName, {
            vector : vector,
            limit : 5,
            // filter : {
            //     must : [
            //         {key :}
            //     ]
            // }

        })
    }

    async moderationGPT(content : string) {
        const moderation = await this.clientGPT.moderations.create({
            model: "omni-moderation-2024-09-26",
            input: content,
        })
        return moderation
    }
}
