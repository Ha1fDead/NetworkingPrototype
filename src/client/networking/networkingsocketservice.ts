import { SOCKET_READY_STATE } from './socketstateenum.js';
import { VClientRequestTracker } from './networkrequesttracker.js';
import { NetworkListener } from './networklistener.js';
import { VServerMessageDTO } from './../../shared/networkmodels/vservermessage.js';
import { SERVER_HOSTNAME, PATH_CHAT, SERVER_INSECURE_PORT } from '../../shared/constants.js';

const DEFAULT_WEBSOCKET_RETRY_MS = 5000;

/**
 * Responsible for handling all Socket communication
 */
export class NetworkingSocketService {
	private clientId!: number | null;

	// how do I get concrete type info here...
	private requestTrackers: VClientRequestTracker<any, any>[];

	/**
	 * Definitely assigned via CreateWebSocket because you cannot reopen a closed websocket
	 */
	private websocket!: WebSocket;

	private Listeners: NetworkListener[] = [];

	constructor() {
		this.requestTrackers = [];
		this.CreateWebsocket();
	}

	public RegisterListener(listener: NetworkListener): void {
		this.Listeners.push(listener);
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
			} else if(serverMessage.Payload !== undefined) {
				// this is a server push data
				// determine where to pipe this in via the object
				for(let listener of this.Listeners) {
					listener.OnReceiveServerPushData(serverMessage.Payload);
				}
				return;
			} else {
				console.log(`we received push data from the server, but cannot handle this case yet!`, event.data);
			}
		} else {
			// this is a response
			let request = this.requestTrackers.find(reqTracker => reqTracker.GetRequestId() === serverRequestId);
			if(request === undefined) {
				throw new Error(`We received a request response from the server, but no associated request with id ${serverRequestId} could be found`);
			}

			request.ResolveRequest(serverMessage.Payload, this.requestTrackers);
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

		for(let queuedReq of this.requestTrackers.filter(track => track.GetHasSent() === false)) {
			queuedReq.SendRequest(this.clientId, this.websocket);
		}
	}

	/**
	 * 
	 * @param data to be sent to the server
	 */
	public SendData<TRequest, TResponse>(data: TRequest): Promise<TResponse> {
		let shouldSendImmediately = this.websocket.readyState === SOCKET_READY_STATE.OPEN && this.clientId !== null;
		let requestTracker = new VClientRequestTracker<TRequest, TResponse>(this.GetUniqueRequestId(), data, shouldSendImmediately);
		this.requestTrackers.push(requestTracker);

		if(this.clientId !== null && shouldSendImmediately) {
			requestTracker.SendRequest(this.clientId, this.websocket);
		} else {
			console.log('could not send data because socket is not open yet. Data will be sent after connection is reopened');
		}

		return requestTracker.GetPromise();
	}

	private uniqueRequestId = 0;
	private GetUniqueRequestId(): number {
		this.uniqueRequestId++;
		return this.uniqueRequestId;
	}
}