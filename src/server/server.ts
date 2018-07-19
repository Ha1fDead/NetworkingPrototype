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
import ChatServer from './chatserver';
import { ServerActionRPC } from '../shared/networkmodels/serveractionenum';

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

interface ConnectionLookup {
	Connection: websocket.connection;
	ConnectionId: number;
}

export class App {
	private server = new HttpServer();
}

export class HttpServer {
	private httpServer: http.Server;
	private httpsServer: https.Server;
	private ChatServer: ChatServer = new ChatServer();
	private connections: ConnectionLookup[] = [];

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

		wsServer.on('connect', this.HandleNewConnection.bind(this));

		wsServer.on('close', (request) => {
			let closedConnections = this.connections.filter(conn => conn.Connection.connected === false);
			this.connections = this.connections.filter(conn => conn.Connection.connected);

			for(let closedConn of closedConnections) {
				console.log(`request closed ${closedConn.ConnectionId}`);
			}

			// broadcast update to all clients that a person has "Logged Out"
		});

		wsServer.on('request', (request) => {
			console.log('ws request?');
		});

		this.httpsServer = https.createServer(certificate, server);
		this.httpsServer.listen(SERVER_SECURE_PORT);
	}

	private HandleNewConnection(connection: websocket.connection): void {
		let connId = this.getUniqueClientId();
		this.connections.push({
			Connection: connection,
			ConnectionId: connId
		});

		let initialConnectMessage: VServerMessageDTO = {
			ClientId: connId,
			RequestId: undefined,
			Action: ServerActionRPC.SetClientId,
			Payload: undefined
		};

		console.log(`New Client connected: ${initialConnectMessage.ClientId}`);
		let strData = JSON.stringify(initialConnectMessage);
		connection.send(strData);

		connection.on('message', (data) => {
			this.HandleNewMessage(connection, data);
		});
	}
	
	private HandleNewMessage(connection: websocket.connection, data: websocket.IMessage): void {
		if(data.utf8Data === undefined) {
			throw new Error('I dont support this use case yet');
		}

		// in the future we would map to request handlers
		let request = <VClientRequestDTO<Message>>JSON.parse(data.utf8Data);
		let message = request.RequestData;
		this.ChatServer.StoreMessage(message);
		let response = this.GenerateResponse(request.ClientId, request.RequestId, message);
		connection.send(JSON.stringify(response));
		this.UpdateAllClients();
	}

	private numClients: number = 0;
	private getUniqueClientId(): number {
		this.numClients++;
		return this.numClients;
	}

	private GenerateResponse(clientId: number, requestId: number, data: any): VServerMessageDTO {
		return {
			ClientId: clientId,
			RequestId: requestId,
			Action: undefined,
			Payload: data
		};
	}

	private UpdateAllClients(): void {
		for(let client of this.connections) {
			let message: VServerMessageDTO = {
				ClientId: client.ConnectionId,
				RequestId: undefined,
				Action: ServerActionRPC.UpdateMessages,
				Payload: this.ChatServer.GetMessages()
			};
			client.Connection.sendUTF(JSON.stringify(message));
		}
	}
}

let app = new App();