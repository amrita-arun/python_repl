import { 
  SubscribeMessage, 
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from "socket.io"
import * as path from 'path';
import * as fs from 'fs';
import * as pty from 'node-pty'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
const AdmZip = require('adm-zip');

@WebSocketGateway({
  namespace: '/terminal',
  cors: { origin: '*' }
})
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private ptyMap: Record<string, pty.IPty> = {};

  private async ensureSandboxFromS3(submissionId: string) {
    const bucket = process.env.S3_BUCKET;
    const sandboxesRoot = '/sandbox';
    const targetFolder = path.join(sandboxesRoot, submissionId);

    if (fs.existsSync(targetFolder)) {
      console.log('Sandbox already exists:', targetFolder);
      return;
    }

    const s3 = new S3Client({ region: process.env.AWS_REGION });
    const key = `${submissionId}.zip`;
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3.send(command);

    if (!response.Body) {
      throw new Error('S3 response.Body is undefined');
    }
    const bodyStream = Readable.from(response.Body as any);

    // Ensure /sandbox exists
    fs.mkdirSync(sandboxesRoot, { recursive: true });

    // Save ZIP to disk
    const zipPath = path.join(sandboxesRoot, `${submissionId}.zip`);
    const writeStream = fs.createWriteStream(zipPath);
    await new Promise<void>((resolve, reject) => {
      bodyStream.pipe(writeStream)
        .on('finish', () => resolve())
        .on('error', (error) => reject(error));
    });

    // Unzip
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(targetFolder, true);

    // Handle nested folder case: /sandbox/<submissionId>/<submissionId>
    const nestedFolder = path.join(targetFolder, submissionId);
    if (fs.existsSync(nestedFolder) && fs.lstatSync(nestedFolder).isDirectory()) {
      for (const file of fs.readdirSync(nestedFolder)) {
        fs.renameSync(
          path.join(nestedFolder, file),
          path.join(targetFolder, file)
        );
      }
      fs.rmdirSync(nestedFolder);
      console.log('Flattened nested folder:', nestedFolder);
    }

    // Clean up ZIP file
    fs.unlinkSync(zipPath);

    console.log('Unzipped sandbox for', submissionId, 'to', targetFolder);
  }

  handleConnection(client: Socket): void {
    const submissionId = client.handshake.query.submissionId as string;
    if (submissionId === "" || submissionId === null) {
      client.emit('error', 'Sandbox not found');
      client.disconnect(true);
      return;
    }

    const sandboxFolder = path.join('/sandbox', submissionId)
    // Ensure sandbox exists (download/unzip from S3 if needed)
    fs.mkdirSync('/sandbox', { recursive: true });
    this.ensureSandboxFromS3(submissionId)
      .then(() => {
        if (!fs.existsSync(sandboxFolder)) {
          client.emit('error', 'Sandbox not found');
          client.disconnect(true);
          return;
        }

        const shell = process.platform === 'win32' ? 'powershell.exe' : 'sh';
        console.log('Spawning shell:', shell, 'in', sandboxFolder);

        const ptyProcess = pty.spawn(shell, ['-i'], {
          name: 'xterm-color',
          cols: 80,
          rows: 30,
          cwd: sandboxFolder,
        });

        ptyProcess.onData((chunk: string) => { client.emit('output', chunk); })
        
        client.on('input', (text: string) => {
          ptyProcess.write(text);
        });

        this.ptyMap[client.id] = ptyProcess;
      })
      .catch((err) => {
        console.error('Failed to prepare sandbox:', err);
        client.emit('error', 'Sandbox preparation failed');
        client.disconnect(true);
      });
  }


  handleDisconnect(client: Socket): void {
    const p = this.ptyMap[client.id];
    if (p) {
      p.kill()
      delete this.ptyMap[client.id];
    }
  }

  @SubscribeMessage('customName')
  handleMessage(client: any, message: any): void {
    this.server.emit('room', `[${client.id}] -> ${message}`);
  }
}
