interface VServerPushData {

}

/**
 * Handles receiving data for a segment of business logic
 * 
 * These are registered into the NetworkingSocketService
 * 
 * How does this interact with Serializers / Deserializers?
 */
interface NetworkListener {
	/**
	 * Callback that should be passed into the NetworkService when data is received
	 */
	OnReceiveServerPushData(data: VServerPushData): void;
}