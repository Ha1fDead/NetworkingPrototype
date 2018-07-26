export interface IMessage {
	/**
	 * The timestamp the message was received on the individual Client
	 */
	ClientReceived: Date | null;

	/**
	 * The timestamp the message was sent from the Client to the Server
	 */
	ClientSent: Date;

	/**
	 * The actual contents of the message
	 */
	Contents: string;

	/**
	 * The Id of the message itself
	 */
	MessageId: number | null;

	/**
	 * The Id of the person who sent the message
	 */
	SenderId: number;

	/**
	 * The timestamp the message was received on the Server
	 */
	ServerReceived: Date | null;
}

export interface IMessageDTOFromServer {
	/**
	 * The timestamp the message was sent from the Client to the Server
	 */
	ClientSent: Date;

	/**
	 * The actual contents of the message
	 */
	Contents: string;

	/**
	 * The Id of the message itself
	 */
	MessageId: number;

	/**
	 * The Id of the person who sent the message
	 */
	SenderId: number;

	/**
	 * The timestamp the message was received on the Server
	 */
	ServerReceived: Date;
}

export interface IMessageDTOFromClient {
	/**
	 * The timestamp the message was sent from the Client to the Server
	 */
	ClientSent: Date;

	/**
	 * The actual contents of the message
	 */
	Contents: string;
}
