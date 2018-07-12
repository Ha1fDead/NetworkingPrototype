import { Message } from './../shared/message';
import { SERVER_HOSTNAME, PATH_CHAT, SERVER_INSECURE_PORT } from '../shared/constants.js';

export class MessagingService {
	private messagesSent = 0;
	private websocket: WebSocket;

	constructor() {
		this.websocket = new WebSocket(`ws://${SERVER_HOSTNAME}:${SERVER_INSECURE_PORT}/${PATH_CHAT}`);
		this.websocket.onopen = (event: Event) => {
			console.log('socket opened', event);
		};

		this.websocket.onclose = (event: CloseEvent) => {
			console.log('socket closed', event);
		};

		this.websocket.onerror = (event: Event) => {
			console.log('ERROR YO', event);
		}

		this.websocket.onmessage = (message: MessageEvent) => {
			console.log('received message', message.data);
		};
	}

	public SendMessage(message: Message): void {
		let stringContents = JSON.stringify(message);
		this.websocket.send(stringContents);
	}
}