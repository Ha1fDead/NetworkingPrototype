import { SERVER_HOSTNAME, PATH_CHAT, SERVER_INSECURE_PORT } from './../shared/constants.js';

interface Message {
	/**
	 * The Id of the person who sent the message
	 */
	SenderId: number;

	/**
	 * The Id of the message itself
	 */
	MessageId: number;

	/**
	 * The actual contents of the message
	 */
	Contents: string;

	/**
	 * The timestamp the message was sent from the Client to the Server
	 */
	Sent: Date;

	/**
	 * The timestamp the message was received on the Server
	 */
	Received: Date;
}

class MessagingService {
	private messagesSent = 0;

	constructor() {
		console.log('client');

		let websocket = new WebSocket(`ws://${SERVER_HOSTNAME}:${SERVER_INSECURE_PORT}/${PATH_CHAT}`);
		websocket.onopen = (event: Event) => {
			console.log('socket opened');
			this.SendMessage(websocket, "First Message!");
		};

		websocket.onclose = (event: CloseEvent) => {
			console.log('socket closed');
		};

		websocket.onerror = (event: Event) => {
			console.log('ERROR YO');
		}

		websocket.onmessage = (message: MessageEvent) => {
			console.log(message.data);
			this.SendMessage(websocket, `received text, sent text ${this.messagesSent} times`);
		};
	}

	private SendMessage(websocket: WebSocket, message: string) {
		websocket.send('hello world');
		this.messagesSent++;
		if(this.messagesSent > 10) {
			websocket.close();
		}
	}
}

let app = new MessagingService();