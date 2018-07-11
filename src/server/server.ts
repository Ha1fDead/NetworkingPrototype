import { SERVER_SECURE_PORT, CGI_PATH, SERVER_INSECURE_PORT } from './../shared/constants';
import * as express from 'express';
import * as Path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
//import * as websocket from 'websocket';

const CGI_DIRECTORY = '../../cgi/client';
const CLIENT_DATA_PATH = Path.join(__dirname, CGI_DIRECTORY);
const CLIENT_DIRECTORY = '../../www';
const CLIENT_DIRECTORY_PATH = Path.join(__dirname, CLIENT_DIRECTORY);
const SERVER_DIRECTORY = '../../server';
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
		server.use(CGI_PATH, express.static(CLIENT_DATA_PATH));
		server.use(express.static(CLIENT_DIRECTORY_PATH));
		
		this.httpServer = http.createServer(function (req, res) {
			let redirectUrl = `https://${req.headers}['host']:${SERVER_SECURE_PORT}${req.url}`;
			res.writeHead(301, { "Location": redirectUrl });
			res.end();
		}).listen(SERVER_INSECURE_PORT);

		this.httpsServer = https.createServer(certificate, server);
		this.httpsServer.listen(SERVER_SECURE_PORT);
	}
}

let app = new App();