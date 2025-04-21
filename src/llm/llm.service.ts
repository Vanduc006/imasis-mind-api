import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ENV } from 'config/env';
@Injectable()
export class LlmService {
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

    async storeEmbedding(vector : string[]) {
        const client = new QdrantClient({host : ENV.QDRANT_URL, port : ENV.QDRANT_PORT})
    }
}
