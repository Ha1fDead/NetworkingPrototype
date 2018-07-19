import { ServerActionRPC } from './serveractionenum';
import { VServerMessageDTO } from './vservermessage';
import { VNetworkTransmission } from "./vnetworktransmission";

export interface VServerMessageDTO<TPayload> extends VNetworkTransmission {
	/**
	 * Undefined if the Server is sending push data, otherwise if it is defined this is a response to a request
	 */
	RequestId: number | undefined,

	/**
	 * Null if this is a response
	 */
	Action: ServerActionRPC | undefined,

	Payload: TPayload
}

export interface VServerPushDTO<TPayload> extends VServerMessageDTO<TPayload> {
	Action: ServerActionRPC,

	RequestId: undefined,

	Payload: TPayload
}

export interface VServerResponseDTO<TPayload> extends VServerMessageDTO<TPayload> {
	RequestId: number,

	Action: undefined,

	Payload: TPayload
}