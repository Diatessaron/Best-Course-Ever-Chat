const BACKEND_URL = 'localhost:3000'

const chatMessages = document.getElementById('chat-messages') as HTMLDivElement;
const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
const sendButton = document.getElementById('send-button') as HTMLButtonElement;

function handleMessage(data: any) {
    const expertMessage = document.createElement('div');
    expertMessage.classList.add('message', 'expert');

    const expertContent = document.createElement('div');
    expertContent.classList.add('content');
    expertContent.textContent = data.message;
    expertMessage.appendChild(expertContent);

    chatMessages.appendChild(expertMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showNotification(username: string, message: string) {
    if (Notification.permission === 'granted') {
        new Notification(`${username} says:`, {
            body: message
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                showNotification(username, message);
            }
        });
    }
}

function sendMessage(worker: Worker) {
    const userMessage = chatInput.value.trim();
    if (userMessage) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'user');

        const contentElement = document.createElement('div');
        contentElement.classList.add('content');
        contentElement.textContent = userMessage;
        messageElement.appendChild(contentElement);

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.value = '';

        worker.postMessage({ type: 'SEND', message: userMessage });
    }
}

if (window.Worker) {
    const worker = new Worker('websocket-worker.js');

    worker.postMessage({ type: 'CONNECT', url: BACKEND_URL });

    worker.addEventListener('message', (event) => {
        const { type, data } = event.data;

        if (type === 'CONNECTED') {
            console.log('Connected to WebSocket server');
        } else if (type === 'MESSAGE' && chatMessages) {
            handleMessage(data);
        } else if (type === 'NOTIFICATION') {
            showNotification(data.username, data.message);
        } else if (type === 'ERROR') {
            console.error('WebSocket Error:', data);
        } else if (type === 'CLOSED') {
            console.log('WebSocket connection closed');
        }
    });

    if (chatMessages && chatInput && sendButton) {
        sendButton.addEventListener('click', () => {
            sendMessage(worker)
        });
    } else {
        console.error('One or more elements are missing in the DOM.');
    }
} else {
    console.error('Web Workers are not supported in this browser.');
}
