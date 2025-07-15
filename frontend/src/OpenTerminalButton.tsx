import React, { useRef, useEffect, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Box, Button, Center, Container, Paper, Text, useMantineTheme } from '@mantine/core';
import { io, Socket } from 'socket.io-client';


interface OpenTerminalButtonProps {
  submissionId: string;
  ecsRunEndpoint: string; // e.g. 'http://localhost:3000/ecs/run'
}

export const OpenTerminalButton: React.FC<OpenTerminalButtonProps> = ({ submissionId, ecsRunEndpoint }) => {
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const term = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const theme = useMantineTheme();
  const terminalContainerRef = useRef<HTMLDivElement>(null);


  // Initialize xterm when wsUrl is set
  useEffect(() => {
    if (!wsUrl || !terminalContainerRef.current) return;

    // Create terminal instance
    term.current = new Terminal({ convertEol: true, cursorBlink: true });
    fitAddon.current = new FitAddon();
    term.current.loadAddon(fitAddon.current);

    term.current.open(terminalContainerRef.current);
    fitAddon.current.fit();
    term.current.focus();

    // Connect using socket.io-client
    const socket: Socket = io(wsUrl, {
      query: { submissionId },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      term.current?.writeln('\r\n\x1b[36m[PTY WebSocket Connected]\x1b[0m\r\n');
    });
    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
    socket.on('output', (data: string) => term.current?.write(data));
    socket.on('disconnect', () => term.current?.writeln('\r\n\x1b[31m<<< Disconnected >>>\x1b[0m'));
    term.current.onData(data => socket.emit('input', data));

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      term.current?.dispose();
    };
  }, [wsUrl, submissionId]);

  const handleClick = async () => {
    try {
      const res = await fetch(ecsRunEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json() as { wsUrl: string };
      // Instead of using wsUrl directly, use the socket.io endpoint
      // e.g., 'http://localhost:3000/terminal'
      // If wsUrl is a host/ip, convert to socket.io endpoint
      let sioUrl = json.wsUrl;
      if (sioUrl.startsWith('ws://')) {
        sioUrl = 'http://' + sioUrl.slice(5).split(':')[0] + ':3000/terminal';
      }
      setWsUrl(sioUrl);
    } catch (err) {
      console.error('Failed to open terminal:', err);
      alert('Could not open terminal. See console for details.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <Center mb="md">
      <Button onClick={handleClick} variant="filled" color="dark">
        Open Terminal
      </Button>
    </Center>
      <Container size="md" px="md" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper
                shadow="md"
                radius="md"
                p={0}
                style={{
                    width: '100%',
                    maxWidth: 800,
                    height: '75vh',
                    backgroundColor: theme.colors.dark[7],
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header Bar */}
                <Box
                    style={{
                        backgroundColor: theme.colors.dark[6],
                        color: theme.white,
                        padding: theme.spacing.sm,
                        borderTopLeftRadius: theme.radius.md,
                        borderTopRightRadius: theme.radius.md,
                        borderBottom: `1px solid ${theme.colors.dark[5]}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Text fw={1000} size="lg">
                        Terminal
                    </Text>
                </Box>

                {/* Terminal Container */}
                <Box
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: theme.colors.dark[7],
                        borderBottomLeftRadius: theme.radius.md,
                        borderBottomRightRadius: theme.radius.md,
                        overflow: 'hidden',
                        textAlign: 'left'
                    }}
                >
                    <div
                        ref={terminalContainerRef}
                        tabIndex={0}
                        onClick={() => term.current?.focus()}
                        style={{
                            width: '100%',
                            height: '100%',
                            flex: 1,
                        }}
                    />
                </Box>
            </Paper>
        </Container>
    </div>
  );
};
