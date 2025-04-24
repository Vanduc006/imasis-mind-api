import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ENV } from 'config/env';


@Injectable()
export class LlmService {

    private readonly qdrantURL = ENV.QDRANT_URL
    private readonly qdrantPORT = ENV.QDRANT_PORT
    private readonly client = new QdrantClient({host : this.qdrantURL, port : this.qdrantPORT})
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
    
    async geminiEmbedding(parseData : string) {
        const ai = new GoogleGenAI({ apiKey : ENV.GEMINI_API_KEY})
        const respone = await ai.models.embedContent({
            model: 'gemini-embedding-exp-03-07',
            contents: parseData,
        })
        return respone.embeddings?.[0].values
    }

    async storeEmbedding(vector : number[],userID : string, collectionName : string, spaceID : string, fileID: string) {
        const data = await this.client.upsert(collectionName, {
            points : [
                {
                    id : "chunk",
                    vector : vector,
                    payload : {
                        spaceID : spaceID,
                        userID: userID,
                        fileID: fileID,
                        chunkIndex: 3,
                    }
                }
            ]
        })


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
