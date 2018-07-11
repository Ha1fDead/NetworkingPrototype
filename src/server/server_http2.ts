import { SERVER_SECURE_PORT, SERVER_INSECURE_PORT } from './../shared/constants';
import * as express from 'express';
import * as Path from 'path';
import * as fs from 'fs';
import * as http2 from 'http2';
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

const certificate: http2.SecureServerOptions = {
    key: fs.readFileSync(SERVER_KEY_PATH),
    cert:  fs.readFileSync(SERVER_CERT_PATH)
};

const enum FILEPATHS {
	Index = "index.html",
	DistBundle = "app.js"
}

export class Http2Server {
	constructor() {
		// http2 example from here: https://dexecure.com/blog/how-to-create-http2-static-file-server-nodejs-with-examples/
		// http server library examples here: https://dexecure.com/blog/native-http2-support-node-frameworks-hapi-koa-express/#express
		let http2Server = http2.createSecureServer(certificate);
		http2Server.listen(SERVER_SECURE_PORT);
		http2Server.on("stream", (stream, headers, flags) => {
			const reqPath = <string>headers[http2.constants.HTTP2_HEADER_PATH];
			const reqMethod = headers[http2.constants.HTTP2_HEADER_METHOD];

			console.log('request path and method', reqPath, reqMethod);

			if(reqPath === '/') {
				const index = Path.join(__dirname, CLIENT_DIRECTORY, FILEPATHS.Index);
				const fd = fs.openSync(index, 'r');
				const stat = fs.fstatSync(fd);

				let headers: http2.OutgoingHttpHeaders = {
					'content-length': stat.size,
					'last-modified': stat.mtime.toUTCString(),
					'content-type': 'text/html'
				};

				stream.respondWithFile(index, headers);
				stream.pushStream({ ":path": "/dist/bundle.js" }, (err, pushStream) => {
					console.log('pushing');
					pushStream.respondWithFile(Path.join(__dirname, CGI_DIRECTORY, FILEPATHS.DistBundle), {
						'content-type': "text/javascript"
					});
				});
				stream.end(() => {
					fs.closeSync(fd);
					console.log('stream ended??');
				});
			} else {
				stream.close(404);
				console.log('unknown request');
			}

			stream.on("error", (err) => {
				console.log(err);
				stream.close(404);
			});
		});
	}
}
