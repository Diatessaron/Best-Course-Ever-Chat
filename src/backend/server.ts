import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT ?? 3000;

const server = createServer(app);

const wss = new WebSocketServer({server});

app.use(express.json())

interface ChatMessage {
    type: string,
    username: string;
    message: string;
    timestamp: string;
}

wss.on('connection', (client) => {
    console.log('New client connected');

    client.on('message', (data) => {
        const message: ChatMessage = JSON.parse(data.toString());

        if (message.type != 'send') return;

        console.log(`[${message.timestamp}] ${message.username}: ${message.message}`);

        setTimeout(() => {
            const responseMessage = {
                username: 'admin',
                message: message.message,
                timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
            };

            client.send(JSON.stringify(responseMessage));

            const ackTimeout = setTimeout(() => {
                console.warn(`No acknowledgment received from client for message: ${responseMessage.message}`);
            }, 5000);

            client.on('message', (ackData) => {
                const ackMessage = JSON.parse(ackData.toString());
                if (ackMessage.type === 'ack') {
                    console.log(`Acknowledgment received for message: ${responseMessage.message}`);
                    clearTimeout(ackTimeout);
                }
            });
        }, 5000);
    });

    client.on('close', () => {
        console.log('Client disconnected');
    });

    client.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

server.listen(PORT);
