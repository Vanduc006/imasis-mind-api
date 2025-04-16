import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
@Injectable()
export class LlmService {
    async geminiEmbedding(parseData : string) {
        const ai = new GoogleGenAI({ apiKey : "AIzaSyDcghjWBDx657lB6nKGR25BG4uN_n8d3RU"})
        const respone = await ai.models.embedContent({
            model: 'gemini-embedding-exp-03-07',
            contents: parseData,
        })
        return respone.embeddings?.[0].values
    }
}
