import { ServerActionRPC } from './serveractionenum';
import { VServerMessageDTO } from './vservermessage';
import { VNetworkTransmission } from "./vnetworktransmission";

export interface VServerMessageDTO extends VNetworkTransmission {
	/**
	 * Undefined if the Server is sending push data, otherwise if it is defined this is a response to a request
	 */
	RequestId: number | undefined,

	/**
	 * Null if this is a response
	 */
	Action: ServerActionRPC | undefined,

	Payload: any
}

export interface VServerPushDTO extends VServerMessageDTO {
	Action: ServerActionRPC,

	RequestId: undefined,

	Payload: any
}

export interface VServerResponseDTO extends VServerMessageDTO {
	RequestId: number,

	Action: undefined,
	
	Payload: any
}