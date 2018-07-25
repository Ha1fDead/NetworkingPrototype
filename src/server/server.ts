import * as express from "express";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as Path from "path";
import * as websocket from "websocket";
import { ServerActionRPC } from "../shared/networkmodels/serveractionenum";
import { SERVER_INSECURE_PORT, SERVER_SECURE_PORT } from "./../shared/constants";
import { IMessageDTOFromClient } from "./../shared/message";
import { IVClientRequestDTO } from "./../shared/networkmodels/vclientrequest";
import ChatServer from "./chatserver";
import ServerConnection from "./servernetworking/serverconnection";

const PUBLIC_DIRECTORY = "../../../www";
const PUBLIC_DIRECTORY_FULL_PATH = Path.join(__dirname, PUBLIC_DIRECTORY);
const SERVER_DIRECTORY = "../../";
const SERVER_DIRECTORY_PATH = Path.join(__dirname, SERVER_DIRECTORY);
const SERVER_KEY_PATH = Path.join(SERVER_DIRECTORY_PATH, "key.pem");
const SERVER_CERT_PATH = Path.join(SERVER_DIRECTORY_PATH, "cert.pem");

const certificate = {
	cert:  fs.readFileSync(SERVER_CERT_PATH),
	key: fs.readFileSync(SERVER_KEY_PATH),
};

export class HttpServer {
	private httpServer: http.Server;
	private httpsServer: https.Server;
	private ChatServer: ChatServer = new ChatServer();
	private connections: ServerConnection[] = [];

	constructor() {
		const server = express();
		server.use(express.static(PUBLIC_DIRECTORY_FULL_PATH));
		
		this.httpServer = http.createServer((req, res) => {
			const redirectUrl = `https://${req.headers}["host"]:${SERVER_SECURE_PORT}${req.url}`;
			res.writeHead(301, { Location: redirectUrl });
			res.end();
		}).listen(SERVER_INSECURE_PORT);

		const wsServer = new websocket.server({
			autoAcceptConnections: true, // You should use false here!
			httpServer: this.httpServer,
		});

		wsServer.on("connect", this.HandleNewConnection.bind(this));

		wsServer.on("close", (request) => {
			const closedConnections = this.connections.filter((conn) => conn.ShouldCloseConnection());
			for (const closedConn of closedConnections) {
				closedConn.CloseConnection(this.connections);
			}

			// broadcast update to all clients that a person has "Logged Out"
		});

		wsServer.on("request", (request) => {
			console.log("ws request?");
		});

		this.httpsServer = https.createServer(certificate, server);
		this.httpsServer.listen(SERVER_SECURE_PORT);
	}

	private HandleNewConnection(connection: websocket.connection): void {
		const connId = this.getUniqueClientId();
		const connectedClient = new ServerConnection(connection, connId);
		this.connections.push(connectedClient);
		connectedClient.PushData(ServerActionRPC.SetClientId);
		connectedClient.PushData(ServerActionRPC.UpdateMessages, this.ChatServer.GetMessages());
		connection.on("message", (data) => {
			this.HandleNewMessage(connection, data);
		});
	}
	
	private HandleNewMessage(connection: websocket.connection, data: websocket.IMessage): void {
		if (data.utf8Data === undefined) {
			throw new Error("I dont support this use case yet");
		}
		
		/**
		 * Similar to the client, we would eventually map to Handlers for calling RPCs
		 * 
		 * It would also be a good idea to desynchronize the Receiving a message from sending a Response
		 */
		const request = JSON.parse(data.utf8Data) as IVClientRequestDTO<IMessageDTOFromClient>;
		const message = request.RequestData;
		const mappedMessage = this.ChatServer.HandleReceiveMessage(message);

		const serverConn = this.connections.find((conn) => conn.GetClientId() === request.ClientId);
		if (serverConn === undefined) {
			throw new Error("Received a message from a client that does not have a client id!!!");
		}

		serverConn.SendResponse(request, mappedMessage);
		for (const conn of this.connections) {
			conn.PushData(ServerActionRPC.UpdateMessages, this.ChatServer.GetMessages());
		}
	}

	private numClients: number = 0;
	private getUniqueClientId(): number {
		this.numClients++;
		return this.numClients;
	}
}
