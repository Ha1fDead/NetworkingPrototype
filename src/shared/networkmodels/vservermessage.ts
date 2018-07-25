import { ServerActionRPC } from "./serveractionenum";
import { IVServerMessageDTO } from "./vservermessage";
import { IVNetworkTransmission } from "./vnetworktransmission";

export interface IVServerMessageDTO<TPayload> extends IVNetworkTransmission {
	/**
	 * Undefined if the Server is sending push data, otherwise if it is defined this is a response to a request
	 */
	RequestId: number | undefined;

	/**
	 * Null if this is a response
	 */
	Action: ServerActionRPC | undefined;

	Payload: TPayload;
}

export interface IVServerPushDTO<TPayload> extends IVServerMessageDTO<TPayload> {
	Action: ServerActionRPC;

	RequestId: undefined;

	Payload: TPayload;
}

export interface IVServerResponseDTO<TPayload> extends IVServerMessageDTO<TPayload> {
	RequestId: number;

	Action: undefined;

	Payload: TPayload;
}
