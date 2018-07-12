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
	Sent: Date;

	/**
	 * The timestamp the message was received on the Server
	 */
	Received: Date | null;
}