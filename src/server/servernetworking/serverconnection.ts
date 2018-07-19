import { VClientRequestDTO } from './../../shared/networkmodels/vclientrequest';
import { VServerPushDTO, VServerResponseDTO } from './../../shared/networkmodels/vservermessage';
import { ServerActionRPC } from './../../shared/networkmodels/serveractionenum';
import * as websocket from 'websocket';

export default class ServerConnection {
	constructor(
		private Connection: websocket.connection,
		private ClientId: number) {
			console.log(`New Client connected: ${this.ClientId}`);
	}

	GetClientId(): number {
		return this.ClientId;
	}

	PushData<TPayload>(action: ServerActionRPC, payload: TPayload | undefined = undefined): void {
		let initialConnectMessage: VServerPushDTO = {
			ClientId: this.ClientId,
			RequestId: undefined,
			Action: action,
			Payload: payload
		};

		let strData = JSON.stringify(initialConnectMessage);
		this.Connection.send(strData);
	}

	SendResponse<TRequest, TPayload>(request: VClientRequestDTO<TRequest>, payload: TPayload): void {
		let responseMessage: VServerResponseDTO = {
			ClientId: this.ClientId,
			Action: undefined,
			RequestId: request.RequestId,
			Payload: payload
		};

		let strData = JSON.stringify(responseMessage);
		this.Connection.send(strData);
	}

	ShouldCloseConnection(): boolean {
		return this.Connection.connected === false;
	}

	CloseConnection(serverConnections: ServerConnection[]): void {
		serverConnections.splice(serverConnections.indexOf(this), 1);
	}
}