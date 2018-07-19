import { ServerActionRPC } from './../../shared/networkmodels/serveractionenum.js';

/**
 * Handles receiving data for a segment of business logic
 * 
 * These are registered into the NetworkingSocketService
 * 
 * How does this interact with Serializers / Deserializers?
 */
export interface NetworkListener {
	GetActionsHandledBy(): ServerActionRPC;

	/**
	 * Callback that should be passed into the NetworkService when data is received
	 */
	OnReceiveServerPushData(data: any): void;
}