import { ServerActionRPC } from './../../shared/networkmodels/serveractionenum.js';
import { SOCKET_READY_STATE } from './socketstateenum.js';
import { VClientRequestTracker } from './networkrequesttracker.js';
import { NetworkListener } from './networklistener.js';
import { VServerMessageDTO, VServerPushDTO, VServerResponseDTO } from './../../shared/networkmodels/vservermessage.js';
import { SERVER_HOSTNAME, PATH_CHAT, SERVER_INSECURE_PORT } from '../../shared/constants.js';

const DEFAULT_WEBSOCKET_RETRY_MS = 5000;

/**
 * Responsible for handling all Socket communication
 */
export class NetworkingSocketService {
	private clientId!: number | null;

	/**
	 * I do not like the <any, any> here but cannot think of an alternative
	 */
	private requestTrackers: VClientRequestTracker<any, any>[];

	/**
	 * Definitely assigned via CreateWebSocket because you cannot reopen a closed websocket
	 */
	private websocket!: WebSocket;

	/**
	 * I don't like the <any> here but I cannot think of an alternative
	 */
	private Listeners: NetworkListener<any>[] = [];

	constructor() {
		this.requestTrackers = [];
		this.CreateWebsocket();
	}

	public RegisterListener<TServerPayload>(listener: NetworkListener<TServerPayload>): void {
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
		let serverMessage = <VServerMessageDTO<any>>JSON.parse(event.data);
		if(this.IsResponse(serverMessage)) {
			this.HandleServerResponse(<VServerResponseDTO<any>>serverMessage);
		} else {
			this.HandleServerPush(<VServerPushDTO<any>>serverMessage);
		}
	}

	private OnSocketOpen(event: Event): void {
		// don't actually do anything on socket open, since we wait for the Server to send us our Client id.
	}

	private HandleServerPush(message: VServerPushDTO<any>): void {
		if(message.Action === ServerActionRPC.SetClientId) {
			this.clientId = message.ClientId;
			this.SendQueuedRequests();
		} else {
			let listenersForAction = this.Listeners.filter(listener => listener.GetActionsHandledBy() === message.Action);
			if(listenersForAction.length === 0) {
				console.log(`We received push data from the server, but do not know how to handle it yet. (We could not find a network handler for this data action Id: ${message.Action})`);
			}
			for(let listener of listenersForAction) {
				listener.OnReceiveServerPushData(message.Payload);
			}
		}
	}

	private HandleServerResponse(message: VServerResponseDTO<any>): void {
		let request = this.requestTrackers.find(reqTracker => reqTracker.GetRequestId() === message.RequestId);
		if(request === undefined) {
			throw new Error(`We received a request response from the server, but no associated request with id ${message.RequestId} could be found`);
		}

		request.ResolveRequest(message.Payload, this.requestTrackers);
	}

	/**
	 * When a WebSocket is closed, either due to a timeout, server shutdown, or the App closing it itself, we should retry opening the connection
	 * @param event 
	 */
	private OnSocketClose(event: CloseEvent): void {
		// TODO - if a socket closes, we need to requeue all of the requests that were executing.
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

	private IsResponse(serverMessage: VServerMessageDTO<any>): boolean {
		return serverMessage.RequestId !== undefined;
	}

	private uniqueRequestId = 0;
	private GetUniqueRequestId(): number {
		this.uniqueRequestId++;
		return this.uniqueRequestId;
	}
}