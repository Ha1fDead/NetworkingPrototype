import { ServerActionRPC } from "./serveractionenum";
import { IVNetworkTransmission } from "./vnetworktransmission";
import { IVServerMessageDTO } from "./vservermessage";

export interface IVServerMessageDTO<TPayload> extends IVNetworkTransmission {

	/**
	 * Null if this is a response
	 */
	Action: ServerActionRPC | undefined;

	Payload: TPayload;

	/**
	 * Undefined if the Server is sending push data, otherwise if it is defined this is a response to a request
	 */
	RequestId: number | undefined;
}

export interface IVServerPushDTO<TPayload> extends IVServerMessageDTO<TPayload> {
	Action: ServerActionRPC;

	Payload: TPayload;

	RequestId: undefined;
}

export interface IVServerResponseDTO<TPayload> extends IVServerMessageDTO<TPayload> {
	Action: undefined;

	Payload: TPayload;

	RequestId: number;
}
