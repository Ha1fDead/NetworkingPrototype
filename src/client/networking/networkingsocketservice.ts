import { PATH_CHAT, SERVER_HOSTNAME, SERVER_INSECURE_PORT } from "../../shared/constants.js";
import { ServerActionRPC } from "./../../shared/networkmodels/serveractionenum.js";
import { IVServerMessageDTO, IVServerPushDTO, IVServerResponseDTO } from "./../../shared/networkmodels/vservermessage.js";
import { INetworkListener } from "./networklistener.js";
import { VClientRequestTracker } from "./networkrequesttracker.js";
import { SOCKET_READY_STATE } from "./socketstateenum.js";

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
	private Listeners: INetworkListener<any>[] = [];

	constructor() {
		this.requestTrackers = [];
		this.CreateWebsocket();
	}

	public RegisterListener<TServerPayload>(listener: INetworkListener<TServerPayload>): void {
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
		const serverMessage = JSON.parse(event.data) as IVServerMessageDTO<any>;
		if (this.IsResponse(serverMessage)) {
			this.HandleServerResponse(serverMessage as IVServerResponseDTO<any>);
		} else {
			this.HandleServerPush(serverMessage as IVServerPushDTO<any>);
		}
	}

	private OnSocketOpen(event: Event): void {
		// don't actually do anything on socket open, since we wait for the Server to send us our Client id.
	}

	private HandleServerPush(message: IVServerPushDTO<any>): void {
		if (message.Action === ServerActionRPC.SetClientId) {
			this.clientId = message.ClientId;
			this.SendQueuedRequests();
		} else {
			const listenersForAction = this.Listeners.filter((listener) => listener.GetActionsHandledBy() === message.Action);
			if (listenersForAction.length === 0) {
				console.log(
					`We received push data from the server, but do not know how to handle it yet. 
					(We could not find a network handler for this data action Id: ${message.Action})`);
			}
			for (const listener of listenersForAction) {
				listener.HandleUpdate(message.Payload);
			}
		}
	}

	private HandleServerResponse(message: IVServerResponseDTO<any>): void {
		const request = this.requestTrackers.find((reqTracker) => reqTracker.GetRequestId() === message.RequestId);
		if (request === undefined) {
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
		console.log("socket closed", event);
		setTimeout(() => {
			// retrying to connect
			this.CreateWebsocket();
		}, DEFAULT_WEBSOCKET_RETRY_MS);
	}

	private OnSocketError(event: Event): void {
		console.log("socket error", event);
	}

	private SendQueuedRequests(): void {
		if (this.clientId === null) {
			throw new Error("Cannot send request tracker without a client id");
		}

		if (this.websocket.readyState !== SOCKET_READY_STATE.OPEN) {
			throw new Error("Cannot send request tracker if the websocket is not currently open");
		}

		for (const queuedReq of this.requestTrackers.filter((track) => track.GetHasSent() === false)) {
			queuedReq.SendRequest(this.clientId, this.websocket);
		}
	}

	/**
	 * 
	 * @param data to be sent to the server
	 */
	public SendData<TRequest, TResponse>(data: TRequest): Promise<TResponse> {
		const shouldSendImmediately = this.websocket.readyState === SOCKET_READY_STATE.OPEN && this.clientId !== null;
		const requestTracker = new VClientRequestTracker<TRequest, TResponse>(this.GetUniqueRequestId(), data, shouldSendImmediately);
		this.requestTrackers.push(requestTracker);

		if (this.clientId !== null && shouldSendImmediately) {
			requestTracker.SendRequest(this.clientId, this.websocket);
		} else {
			console.log("could not send data because socket is not open yet. Data will be sent after connection is reopened");
		}

		return requestTracker.GetPromise();
	}

	private IsResponse(serverMessage: IVServerMessageDTO<any>): boolean {
		return serverMessage.RequestId !== undefined;
	}

	private uniqueRequestId = 0;
	private GetUniqueRequestId(): number {
		this.uniqueRequestId++;
		return this.uniqueRequestId;
	}
}
