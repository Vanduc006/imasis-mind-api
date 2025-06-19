import { Process,Processor } from "@nestjs/bull";
import { Job } from "bull";

@Processor('uploadQueue')
export class UploadProcessor {
    // merge upload and embedding
    @Process('parsePDF')
    async handleParsePDF(job : Job) {
        const { key,spaceID, size} = job.data   


    }

}