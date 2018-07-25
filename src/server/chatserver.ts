import { IMessage, IMessageDTOFromClient } from "./../shared/message";
export default class ChatServer {
	private messages: IMessage[] = [];
	private numMessages: number = 0;

	constructor() {
		this.createDefaultData();
	}

	public HandleReceiveMessage(message: IMessageDTOFromClient): IMessage {
		const mappedMessage: IMessage = {
			ClientReceived: null,
			ClientSent: message.ClientSent,
			Contents: message.Contents,
			MessageId: this.getMessageUUID(),
			SenderId: 999, // will eventually be taken from authentication
			ServerReceived: new Date(),
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
	public GetMessages(): IMessage[] {
		return this.messages;
	}

	private createDefaultData(): void {
		// proof of concept -- hydrate server messages with dummy data
		// in the future this would obviously load from database or something
		const unixMessageStart = new Date().getTime() - (1000 * 60 * 60 * 24 * 30); // one month ago
		
		const defaultMessageCount = 1000;
		const dateOffset = 1000 * 60 * 60; // one hour
		for (let x = 0; x < defaultMessageCount; x++) {
			const message = `This is a random message ${x}`;
			const sDate = new Date(unixMessageStart + (dateOffset * x));
			const rDate = new Date(unixMessageStart + (dateOffset * x + 100));
			this.messages.push(this.createdefaultmessage(this.getMessageUUID(), 0, message, sDate, rDate));
		}
	}

	private createdefaultmessage(mId: number, sId: number, message: string, sDate: Date, rDate: Date): IMessage {
		return {
			ClientReceived: null,
			ClientSent: sDate,
			Contents: message,
			MessageId: mId,
			SenderId: sId,
			ServerReceived: rDate,
		};
	}

	private getMessageUUID(): number {
		this.numMessages++;
		return this.numMessages;
	}
}
