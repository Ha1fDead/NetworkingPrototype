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
import ServerConnection from './servernetworking/serverconnection';

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
	private ChatServer: ChatServer = new ChatServer();
	private connections: ServerConnection[] = [];

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
			let closedConnections = this.connections.filter(conn => conn.ShouldCloseConnection());
			for(let closedConn of closedConnections) {
				closedConn.CloseConnection(this.connections);
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
		let connectedClient = new ServerConnection(connection, connId);
		this.connections.push(connectedClient);
		connectedClient.PushData(ServerActionRPC.SetClientId);
		connectedClient.PushData(ServerActionRPC.UpdateMessages, this.ChatServer.GetMessages());
		connection.on('message', (data) => {
			this.HandleNewMessage(connection, data);
		});
	}
	
	private HandleNewMessage(connection: websocket.connection, data: websocket.IMessage): void {
		if(data.utf8Data === undefined) {
			throw new Error('I dont support this use case yet');
		}
		
		/**
		 * Similar to the client, we would eventually map to Handlers for calling RPCs
		 */
		let request = <VClientRequestDTO<Message>>JSON.parse(data.utf8Data);
		let message = request.RequestData;
		this.ChatServer.StoreMessage(message);

		let serverConn = this.connections.find(conn => conn.GetClientId() === request.ClientId);
		if(serverConn === undefined) {
			throw new Error('Received a message from a client that does not have a client id!!!');
		}

		serverConn.SendResponse(request, message);
		for(let conn of this.connections) {
			conn.PushData(ServerActionRPC.UpdateMessages, this.ChatServer.GetMessages());
		}
	}

	private numClients: number = 0;
	private getUniqueClientId(): number {
		this.numClients++;
		return this.numClients;
	}
}

let app = new App();