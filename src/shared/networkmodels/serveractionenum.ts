
/**
 * Set on ServerMessages sent to the Client so that the client can call an RPC
 */
export enum ServerActionRPC {
	/**
	 * Sent to the client after an initial connection is made
	 * 
	 * The client should then store this field and send it as part of all future communications to identify which client made the request
	 * 
	 * This number should NOT be used to validate a user can make a request, as that should be handled cryptographically via JWT Tokens / OAuth tokens.
	 */
	SetClientId,
	
	UpdateMessages
};