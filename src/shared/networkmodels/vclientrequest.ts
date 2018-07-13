import DeferredPromise from "../deferredpromise";
import { VNetworkTransmission } from "./vnetworktransmission";

export interface VClientRequestDTO<TRequest> extends VNetworkTransmission {
	/**
	 * The unique id of this network request that was sent from the Client to the Server
	 * 
	 * This is how you determine which request to map a response to
	 */
	RequestId: number,

	/**
	 * The serializable data that will be sent from the Client to the Server for processing
	 */
	RequestData: TRequest
}
