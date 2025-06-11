import { Injectable } from '@nestjs/common';
import { ENV } from 'config/env';
import { createClient } from '@supabase/supabase-js';
import { ulid } from 'ulid';

@Injectable()
export class DatabaseService {
    private readonly supabase = createClient(ENV.SUPABASE_URL,ENV.SUPABASE_KEY)

    async newMessage(
        messageID : string,
        message : string,
        userID : string,
        spaceID : string,
    ) {
        const { error } = await this.supabase
        .from('chat')
        .insert({
            messageid : messageID,
            userid : userID,
            spaceid : spaceID,
            message : message,
            status : "processing",
        })
        if ( error ) {
            return error
        } 
        return 'Adding new message ok'
    }

    // async newObject(
    //     objectKey: string,
    //     spaceID: string,
    // ) {

    // }

    async updateMessage(
        messageID : string,
        spaceID : string,
        updates : Partial<{
            status : string,
            moderation : string,
        }>,
    ) {
        const { error } = await this.supabase
        .from('chat')
        .update(updates)
        .match({spaceid : spaceID,messageid : messageID})

        if (error) {
            return error
        }
        return "Update ok"
    }

    async createID() {
        return ulid()
    }
}
