import DeferredPromise from "../deferredpromise";
import { IVNetworkTransmission } from "./vnetworktransmission";

export interface IVClientRequestDTO<TRequest> extends IVNetworkTransmission {
	/**
	 * The unique id of this network request that was sent from the Client to the Server
	 * 
	 * This is how you determine which request to map a response to
	 */
	RequestId: number;

	/**
	 * The serializable data that will be sent from the Client to the Server for processing
	 */
	RequestData: TRequest;
}
