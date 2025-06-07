import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';
import AdmZip from 'adm-zip'
import { SubmissionsService } from './submissions.service';

@Controller('submissions')
export class SubmissionsController {
    constructor (private readonly submissionService: SubmissionsService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadSubmission(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded.')

        }

        const submissionId = await this.submissionService.unpackZip(file.buffer, file.originalname);
        return { message: `Unzipped into sandboxes /${submissionId}`}
    }
}
