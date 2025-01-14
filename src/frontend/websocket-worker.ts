interface ChatMessage {
    username: string;
    message: string;
    timestamp: string;
}

self.addEventListener('message', (event) => {
    if (event.data.type === 'CONNECT') {
        const backendUrl = event.data.url;
        const socket = new WebSocket(`ws://${backendUrl}`);

        socket.addEventListener('open', () => {
            self.postMessage({type: 'CONNECTED'});
        });

        socket.addEventListener('message', (event) => {
            const messageData = JSON.parse(event.data) as ChatMessage;

            self.postMessage({type: 'MESSAGE', data: messageData});

            self.postMessage({type: 'NOTIFICATION', data: messageData});

            socket.send(JSON.stringify({ type: 'ack' }));
        });

        socket.addEventListener('error', (error) => {
            self.postMessage({type: 'ERROR', error: (error as ErrorEvent).message || 'Unknown error'});
        });

        socket.addEventListener('close', () => {
            self.postMessage({type: 'CLOSED'});
        });

        self.addEventListener('message', (event) => {
            if (event.data.type === 'SEND' && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'send',
                    username: 'user',
                    message: event.data.message,
                    timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
                }));
            }
        });
    }
});
