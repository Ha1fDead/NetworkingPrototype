import { VClientRequestDTO } from './../../shared/networkmodels/vclientrequest.js';
import { VServerMessageDTO } from './../../shared/networkmodels/vservermessage.js';
import { SERVER_HOSTNAME, PATH_CHAT, SERVER_INSECURE_PORT } from '../../shared/constants.js';
import DeferredPromise from '../../shared/deferredpromise.js';

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#Ready_state_constants
 */
enum SOCKET_READY_STATE {
	CONNECTION = 0,
	OPEN = 1,
	CLOSING = 2,
	CLOSED = 3
}

interface VClientRequestTracker<TRequest, TResponse> {
	RequestData: VClientRequestDTO<TRequest>;

	HasSent: boolean;

	// how do I get concrete type info here...
	Promise: DeferredPromise<TResponse>;
}

/**
 * Responsible for handling all Socket communication
 */
export class NetworkingSocketService {
	private clientId!: number | null;

	private requestTrackers: VClientRequestTracker<any,any>[];

	/**
	 * Definitely assigned via CreateWebSocket because you cannot reopen a closed websocket
	 */
	private websocket!: WebSocket;

	constructor() {
		this.requestTrackers = [];
		this.CreateWebsocket();
	}

	private CreateWebsocket(): void {
		this.clientId = null;
		this.websocket = new WebSocket(`ws://${SERVER_HOSTNAME}:${SERVER_INSECURE_PORT}/${PATH_CHAT}`);
		this.websocket.onopen = this.OnSocketOpen.bind(this);
		this.websocket.onclose = this.OnSocketClose.bind(this);
		this.websocket.onerror = this.OnSocketError.bind(this);
		this.websocket.onmessage = this.OnSocketMessage.bind(this);
	}

	/**
	 * Message maps the received data to a "Transmission" to map it into a "Format" and then notify "Listners"
	 * @param event 
	 */
	private OnSocketMessage(event: MessageEvent): void {
		let serverMessage = <VServerMessageDTO>JSON.parse(event.data);
		let serverRequestId = serverMessage.RequestId;

		if(serverRequestId === undefined) {
			if(this.clientId === null) {
				this.clientId = serverMessage.ClientId;
				console.log(`Received client id from server: ${this.clientId}`);
			}

			// this is a server push data
			// determine where to pipe this in via the object
			console.log(`we received push data from the server, but cannot handle this case yet!`, event.data);
		} else {
			// this is a response
			let request = this.requestTrackers.find(reqTracker => reqTracker.RequestData.RequestId === serverRequestId);
			if(request === undefined) {
				throw new Error(`We received a request response from the server, but no associated request with id ${serverRequestId} could be found`);
			}

			// resolve and remove request
			request.Promise.deferredResolve(serverMessage.Payload);
			this.requestTrackers.splice(this.requestTrackers.indexOf(request), 1);
		}
	}

	private OnSocketOpen(event: Event): void {
		console.log('socket opened', event);

		if(this.requestTrackers.filter(x => x.HasSent).length > 0) {
			throw new Error('there are pending requests that have not been handled.');
		}
	}

	/**
	 * When a WebSocket is closed, either due to a timeout, server shutdown, or the App closing it itself, we should retry opening the connection
	 * @param event 
	 */
	private OnSocketClose(event: CloseEvent): void {
		console.log('socket closed', event);
		const DEFAULT_WEBSOCKET_RETRY_MS = 5000;
		setTimeout(() => {
			// retrying to connect
			this.CreateWebsocket();
		}, DEFAULT_WEBSOCKET_RETRY_MS)
	}

	private OnSocketError(event: Event): void {
		console.log('socket error', event);
	}

	/**
	 * 
	 * @param data to be sent to the server
	 */
	public SendData<TRequest, TResponse>(data: TRequest): Promise<TResponse> {
		let deferredPromise = new DeferredPromise<TResponse>();

		if(this.clientId === null) {
			throw new Error(`The connection is open, but we don't have a connection id yet!`);
		}

		let request: VClientRequestDTO<TRequest> = {
			ClientId: this.clientId,
			RequestId: this.GetUniqueRequestId(),
			RequestData: data
		};

		let requestTracker: VClientRequestTracker<TRequest, TResponse> = {
			RequestData: request,
			HasSent: this.websocket.readyState === SOCKET_READY_STATE.OPEN,
			Promise: deferredPromise
		};

		this.requestTrackers.push(requestTracker);
		if(requestTracker.HasSent) {
			let str = JSON.stringify(request);
			this.websocket.send(str);
		}
		else {
			console.log('could not send data because socket is not open yet. Data will be sent after connection is reopened');
		}

		return deferredPromise.Promise;
	}

	private uniqueRequestId = 0;
	private GetUniqueRequestId(): number {
		this.uniqueRequestId++;
		return this.uniqueRequestId;
	}
}