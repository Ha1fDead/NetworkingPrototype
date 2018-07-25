import { IVClientRequestDTO } from "./../../shared/networkmodels/vclientrequest";
import { IVServerPushDTO, IVServerResponseDTO } from "./../../shared/networkmodels/vservermessage";
import { ServerActionRPC } from "./../../shared/networkmodels/serveractionenum";
import * as websocket from "websocket";

export default class ServerConnection {
	constructor(
		private Connection: websocket.connection,
		private ClientId: number) {
			console.log(`New Client connected: ${this.ClientId}`);
	}

	public GetClientId(): number {
		return this.ClientId;
	}

	public PushData<TPayload>(action: ServerActionRPC, payload?: TPayload): void {
		const initialConnectMessage: IVServerPushDTO<TPayload | undefined> = {
			Action: action,
			ClientId: this.ClientId,
			Payload: payload,
			RequestId: undefined,
		};

		const strData = JSON.stringify(initialConnectMessage);
		this.SendData(strData);
	}

	public SendResponse<TRequest, TPayload>(request: IVClientRequestDTO<TRequest>, payload: TPayload): void {
		const responseMessage: IVServerResponseDTO<TPayload> = {
			Action: undefined,
			ClientId: this.ClientId,
			Payload: payload,
			RequestId: request.RequestId,
		};

		const strData = JSON.stringify(responseMessage);
		this.SendData(strData);
	}

	public ShouldCloseConnection(): boolean {
		return this.Connection.connected === false;
	}

	public CloseConnection(serverConnections: ServerConnection[]): void {
		serverConnections.splice(serverConnections.indexOf(this), 1);
	}

	private SendData(stringified: string): void {
		const randomTimeout = Math.random() * 3000;
		setTimeout(() => {
			this.Connection.send(stringified);
		}, randomTimeout);
	}
}
