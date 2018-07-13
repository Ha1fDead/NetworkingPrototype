import { VClientRequestDTO } from './../shared/networkmodels/vclientrequest';
import { VServerMessageDTO } from './../shared/networkmodels/vservermessage';
import { Message } from './../shared/message';
import { SERVER_SECURE_PORT, SERVER_INSECURE_PORT } from './../shared/constants';
import * as express from 'express';
import * as Path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import * as websocket from 'websocket';

const PUBLIC_DIRECTORY = '../../../www';
const PUBLIC_DIRECTORY_FULL_PATH = Path.join(__dirname, PUBLIC_DIRECTORY);
const SERVER_DIRECTORY = '../../';
const SERVER_DIRECTORY_PATH = Path.join(__dirname, SERVER_DIRECTORY);
const SERVER_KEY_PATH = Path.join(SERVER_DIRECTORY_PATH, 'key.pem');
const SERVER_CERT_PATH = Path.join(SERVER_DIRECTORY_PATH, 'cert.pem');

const certificate = {
    key: fs.readFileSync(SERVER_KEY_PATH),
    cert:  fs.readFileSync(SERVER_CERT_PATH)
};

export class App {
	private server = new HttpServer();
}

export class HttpServer {
	private httpServer: http.Server;
	private httpsServer: https.Server;

	constructor() {
		let server = express();
		server.use(express.static(PUBLIC_DIRECTORY_FULL_PATH));
		
		this.httpServer = http.createServer(function (req, res) {
			let redirectUrl = `https://${req.headers}['host']:${SERVER_SECURE_PORT}${req.url}`;
			res.writeHead(301, { "Location": redirectUrl });
			res.end();
		}).listen(SERVER_INSECURE_PORT);

		var wsServer = new websocket.server({
			httpServer: this.httpServer,
			autoAcceptConnections: true // You should use false here!
		});

		wsServer.on('connect', (connection) => {
			console.log('connected websocket!');

			let initialConnectMessage: VServerMessageDTO = {
				ClientId: this.getUniqueClientId(),
				RequestId: undefined,
				Payload: undefined
			};

			let strData = JSON.stringify(initialConnectMessage);
			connection.send(strData);
			connection.on('message', (data) => {
				if(data.utf8Data === undefined) {
					throw new Error('I dont support this use case yet');
				}

				let request = <VClientRequestDTO<Message>>JSON.parse(data.utf8Data);
				let message = request.RequestData;
				message.Received = new Date();
				message.SenderId = 999; // eventually replace with "UserId" of the logged-in-user
				message.MessageId = this.getMessageUUID();

				let response = this.GenerateResponse(request.ClientId, request.RequestId, message);
				connection.send(JSON.stringify(response));
			});
		});

		wsServer.on('close', (request) => {
			console.log('request closed');
		});

		wsServer.on('request', (request) => {
			console.log('ws request?');
		});

		this.httpsServer = https.createServer(certificate, server);
		this.httpsServer.listen(SERVER_SECURE_PORT);
	}

	private numClients: number = 0;
	private getUniqueClientId(): number {
		this.numClients++;
		return this.numClients;
	}

	private numMessages: number = 0;
	private getMessageUUID(): number {
		this.numMessages++;
		return this.numMessages;
	}

	private GenerateResponse(clientId: number, requestId: number, data: any): VServerMessageDTO {
		return {
			ClientId: clientId,
			RequestId: requestId,
			Payload: data
		};
	}
}

let app = new App();