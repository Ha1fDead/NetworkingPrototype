import { SERVER_HOSTNAME, SERVER_SECURE_PORT, PATH_CHAT } from './../shared/constants.js';

class ClientApp {
	private messagesSent = 0;

	constructor() {
		console.log('client');


		let websocket = new WebSocket(`ws://${SERVER_HOSTNAME}:${SERVER_SECURE_PORT}/${PATH_CHAT}`);
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

let app = new ClientApp();