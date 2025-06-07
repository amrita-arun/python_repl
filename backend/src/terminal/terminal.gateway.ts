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

@WebSocketGateway({
  namespace: '/terminal',
  cors: { origin: '*' }
})
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private ptyMap: Record<string, pty.IPty> = {};

  handleConnection(client: Socket): void {
    const submissionId = client.handshake.query.submissionId as string;
    if (submissionId === "" || submissionId === null) {
      client.emit('error', 'Sandbox not found');
      client.disconnect(true);
      return;
    }

    const sandboxFolder = path.join(__dirname, '../../sandboxes', submissionId)
    //console.log(sandboxFolder)
    if (!fs.existsSync(sandboxFolder)) {
      client.emit('error', 'Sandbox not found');
      client.disconnect(true);
      return;
    }

    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const args = [
      '-c',
      //`cd ${sandboxFolder} -i`
    ]

    const ptyProcess = pty.spawn(shell, ['-i'], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: sandboxFolder
      //env: process.env
    });

    ptyProcess.onData((chunk: string) => { client.emit('output', chunk); })
    
    client.on('input', (text: string) => {
      ptyProcess.write(text);
    });

    this.ptyMap[client.id] = ptyProcess;
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
