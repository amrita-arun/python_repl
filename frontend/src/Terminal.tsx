import React, { useEffect, useRef } from 'react';
import { Box, Center, Container, Paper, Text, useMantineTheme } from '@mantine/core';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from 'xterm-addon-fit';
import { io, Socket } from 'socket.io-client';
import 'xterm/css/xterm.css';

interface TerminalProps {
    submissionId: string | null
}

export default function Terminal({ submissionId }: TerminalProps) {
    const theme = useMantineTheme();

    const terminalContainerRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!submissionId) {
            return;
        }
        const xterm = new XTerm({});
        const fitAddon = new FitAddon();
        xterm.loadAddon(fitAddon);
        xtermRef.current = xterm;
        fitAddonRef.current = fitAddon;

        setTimeout(() => {
            if (terminalContainerRef.current) {
                xterm.open(terminalContainerRef.current);
                fitAddon.fit();
                xterm.writeln('\x1b[32m*** Connecting to Shell ***\x1b[0m');
            }
        }, 0);

        return () => {
            xterm.dispose();
        }
    }, [submissionId]);


    useEffect(() => {
        if (!xtermRef.current) return;

        const socket = io('http://localhost:3000/terminal', {
            query: { submissionId: submissionId },
            transports: ['websocket'],
            });
        socketRef.current = socket;
          
        socket.on('connect', () => {
            xtermRef.current!.writeln('\r\n\x1b[36m[PTY WebSocket Connected]\x1b[0m\r\n');
        })

        socket.on('output', (chunk: string) => {
            xtermRef.current!.write(chunk)
        })

        socket.on('disconnect', (reason: string) => {
            xtermRef.current!.write(reason)
        })

        xtermRef.current!.onData((data) => {
            socket.emit('input', data);
        })

        return () => {
            socket.disconnect();
        }
            
    }, [submissionId])

    useEffect(() => {
        const handleResize = () => {
            requestAnimationFrame(() => {
                fitAddonRef.current?.fit();
            });
        }

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return (
        <Container size="md" px="md" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper
                shadow="md"
                radius="md"
                p={0}
                style={{
                    width: '100%',
                    maxWidth: 800,
                    minHeight: 500,
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
                    <Text fw={500} size="lg">
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
                        style={{
                            width: '100%',
                            height: '100%',
                            flex: 1,
                        }}
                    />
                </Box>
            </Paper>
        </Container>
    );
}