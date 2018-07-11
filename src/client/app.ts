import { SERVER_URL } from './../shared/constants';

class ClientApp {
	constructor() {
		console.log('client');

		let messagesSent = 0;

		let websocket = new WebSocket(SERVER_URL);
		websocket.onopen = (event: Event) => {
			console.log('socket opened');
		};

		websocket.onclose = (event: CloseEvent) => {
			console.log('socket closed');
		};

		websocket.onmessage = (message: MessageEvent) => {
			console.log(message.data);

			messagesSent++;
			if(messagesSent > 10) {
				websocket.close();
			}
			websocket.send('received text');
		};
		websocket.send('hello world');
	}
}