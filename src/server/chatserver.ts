import { Message, MessageDTOFromClient } from './../shared/message';
export default class ChatServer {
	private messages: Message[] = [];
	private numMessages: number = 0;

	constructor() {
		this.createDefaultData();
	}

	private createDefaultData(): void {
		// proof of concept -- hydrate server messages with dummy data
		// in the future this would obviously load from database or something
		let unixMessageStart = new Date().getTime() - (1000 * 60 * 60 * 24 * 30); // one month ago
		
		const defaultMessageCount = 1000;
		const dateOffset = 1000 * 60 * 60; // one hour
		for(let x = 0; x < defaultMessageCount; x++) {
			let message = `This is a random message ${x}`;
			let sDate = new Date(unixMessageStart + (dateOffset * x));
			let rDate = new Date(unixMessageStart + (dateOffset * x + 100));
			this.messages.push(this.createdefaultmessage(this.getMessageUUID(), 0, message, sDate, rDate));
		}
	}

	private createdefaultmessage(mId: number, sId: number, message: string, sDate: Date, rDate: Date): Message {
		return {
			MessageId: mId,
			SenderId: sId,
			Contents: message,
			ClientSent: sDate,
			ServerReceived: rDate,
			ClientReceived: null
		}
	}

	HandleReceiveMessage(message: MessageDTOFromClient): Message {
		let mappedMessage: Message = {
			SenderId: 999, // will eventually be taken from authentication
			Contents: message.Contents,
			ClientSent: message.ClientSent,
			MessageId: this.getMessageUUID(),
			ServerReceived: new Date(),
			ClientReceived: null
		};
		this.messages.push(mappedMessage);
		return mappedMessage;
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