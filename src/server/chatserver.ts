import { Message } from './../shared/message';
export default class ChatServer {
	private messages: Message[] = [];
	private numMessages: number = 0;

	constructor() {

	}

	StoreMessage(message: Message): void {
		message.Received = new Date();
		message.SenderId = 999; // eventually replace with "UserId" of the logged-in-user
		message.MessageId = this.getMessageUUID();
		this.messages.push(message);
	}

	/**
	 * Synchronization / paging concerns
	 * 
	 * 1. Get recent messages?
	 * 2. Get start of new room messages?
	 * 3. Get messages from Date?
	 */
	GetMessages(): Message[] {
		return this.messages;
	}

	private getMessageUUID(): number {
		this.numMessages++;
		return this.numMessages;
	}
}