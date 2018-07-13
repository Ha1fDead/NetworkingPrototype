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

/**
 * Tracks requests that are currently being processed from the client to the server
 */
interface VClientRequestTracker<TRequest, TResponse> {
	RequestId: number;

	RequestData: TRequest;

	HasSent: boolean;

	Promise: DeferredPromise<TResponse>;
}

/**
 * Responsible for handling all Socket communication
 */
export class NetworkingSocketService {
	private clientId!: number | null;

	// how do I get concrete type info here...
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
				this.SendQueuedRequests();
			}

			// this is a server push data
			// determine where to pipe this in via the object
			console.log(`we received push data from the server, but cannot handle this case yet!`, event.data);
		} else {
			// this is a response
			let request = this.requestTrackers.find(reqTracker => reqTracker.RequestId === serverRequestId);
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

	private SendQueuedRequests(): void {
		if(this.clientId === null) {
			throw new Error('Cannot send request tracker without a client id');
		}

		if(this.websocket.readyState !== SOCKET_READY_STATE.OPEN) {
			throw new Error('Cannot send request tracker if the websocket is not currently open');
		}

		for(let queuedReq of this.requestTrackers.filter(track => track.HasSent === false)) {
			this.SendRequestTracker(queuedReq);
		}
	}

	/**
	 * 
	 * @param data to be sent to the server
	 */
	public SendData<TRequest, TResponse>(data: TRequest): Promise<TResponse> {
		let deferredPromise = new DeferredPromise<TResponse>();

		let shouldSendImmediately = this.websocket.readyState === SOCKET_READY_STATE.OPEN && this.clientId !== null;
		let requestTracker: VClientRequestTracker<TRequest, TResponse> = {
			RequestId: this.GetUniqueRequestId(),
			RequestData: data,
			HasSent: shouldSendImmediately,
			Promise: deferredPromise
		};

		this.requestTrackers.push(requestTracker);
		if(shouldSendImmediately) {
			this.SendRequestTracker(requestTracker);
		} else {
			console.log('could not send data because socket is not open yet. Data will be sent after connection is reopened');
		}

		return deferredPromise.Promise;
	}

	private SendRequestTracker<TRequest, TResponse>(requestToSend: VClientRequestTracker<TRequest, TResponse>): void {
		if(this.clientId === null) {
			throw new Error('Cannot send request tracker without a client id');
		}

		if(this.websocket.readyState !== SOCKET_READY_STATE.OPEN) {
			throw new Error('Cannot send request tracker if the websocket is not currently open');
		}

		requestToSend.HasSent = true;
		let requestDTO: VClientRequestDTO<TRequest> = {
			ClientId: this.clientId,
			RequestId: requestToSend.RequestId,
			RequestData: requestToSend.RequestData
		};

		let stringified = JSON.stringify(requestDTO);
		this.websocket.send(stringified);
	}

	private uniqueRequestId = 0;
	private GetUniqueRequestId(): number {
		this.uniqueRequestId++;
		return this.uniqueRequestId;
	}
}