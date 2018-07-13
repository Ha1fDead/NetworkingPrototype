import { VServerMessageDTO } from './vservermessage';
import { VNetworkTransmission } from "./vnetworktransmission";

export interface VServerMessageDTO extends VNetworkTransmission {
	/**
	 * Undefined if the Server is sending push data, otherwise if it is defined this is a response to a request
	 */
	RequestId: number | undefined,

	Payload: any
}