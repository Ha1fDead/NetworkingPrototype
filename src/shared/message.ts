export interface Message {
	/**
	 * The Id of the person who sent the message
	 */
	SenderId: number;

	/**
	 * The Id of the message itself
	 */
	MessageId: number | null;

	/**
	 * The actual contents of the message
	 */
	Contents: string;

	/**
	 * The timestamp the message was sent from the Client to the Server
	 */
	ClientSent: Date;

	/**
	 * The timestamp the message was received on the Server
	 */
	ServerReceived: Date | null;

	/**
	 * The timestamp the message was received on the individual Client
	 */
	ClientReceived: Date | null;
}

export interface MessageDTOFromServer {
	/**
	 * The Id of the person who sent the message
	 */
	SenderId: number;

	/**
	 * The Id of the message itself
	 */
	MessageId: number;

	/**
	 * The actual contents of the message
	 */
	Contents: string;

	/**
	 * The timestamp the message was received on the Server
	 */
	ServerReceived: Date;

	/**
	 * The timestamp the message was sent from the Client to the Server
	 */
	ClientSent: Date;
}

export interface MessageDTOFromClient {
	/**
	 * The actual contents of the message
	 */
	Contents: string;

	/**
	 * The timestamp the message was sent from the Client to the Server
	 */
	ClientSent: Date;
}