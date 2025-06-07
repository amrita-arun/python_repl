import { BadRequestException, Injectable } from '@nestjs/common';
import * as path from 'path'
import * as fs from 'fs'
const AdmZip = require('adm-zip');

@Injectable()
export class SubmissionsService {
    private sandboxesRoot = path.join(__dirname, '../../sandboxes')

    async unpackZip(buffer: Buffer, originalName: string) {
        const { name, ext } = path.parse(originalName);
        if (ext.toLowerCase() !== '.zip') {
            throw new BadRequestException('Only .zip files allowed')
        }

        const submissionId = name;
        const targetFolder = path.join(this.sandboxesRoot, submissionId)

        if (fs.existsSync(targetFolder)) {
            throw new BadRequestException(`Submission "${submissionId}" already exists.`)
        }

        fs.mkdirSync(targetFolder, { recursive: true });

        const zip = new AdmZip(buffer);
        zip.extractAllTo(targetFolder, true);

        return submissionId;
    }

}
