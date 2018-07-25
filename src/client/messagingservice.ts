import { ServerActionRPC } from './../shared/networkmodels/serveractionenum.js';
import { NetworkListener } from './networking/networklistener';
import { Message, MessageDTOFromClient, MessageDTOFromServer } from '../shared/message';
import { NetworkingSocketService } from './networking/networkingsocketservice.js';

type MessageCallback = (m: Message[]) => void;

export class MessagingService implements NetworkListener<Message[]> {

	private messages: Message[] = [];
	public MessageUpdateListeners: MessageCallback[] = [];

	constructor(
		private networkingSocketService: NetworkingSocketService) {
		this.networkingSocketService.RegisterListener(this);
	}
	
	GetActionsHandledBy(): ServerActionRPC {
		return ServerActionRPC.UpdateMessages;
	}

	public async SendMessage(message: string): Promise<void> {
		let messageToSend: MessageDTOFromClient = {
			Contents: message,
			ClientSent: new Date()
		};

		let clientMessage: Message = {
			SenderId: 1,
			MessageId: null,
			ServerReceived: null,
			Contents: message,
			ClientSent: messageToSend.ClientSent,
			ClientReceived: new Date()
		}
		
		this.messages.push(clientMessage);
		this.messages.sort(this.SortMessages);
		this.NotifyListeners();

		let res = await this.networkingSocketService.SendData<MessageDTOFromClient, MessageDTOFromServer>(messageToSend);

		clientMessage.SenderId = res.SenderId;
		clientMessage.ServerReceived = res.ServerReceived;
		clientMessage.MessageId = res.MessageId;

		this.NotifyListeners();
	}

	HandleUpdate(data: Message[]): void {
		let now = new Date();
		for(let message of data.filter(msg => msg.ClientReceived === null)) {
			message.ClientReceived = now;
		}

		this.messages = data;
		this.messages.sort(this.SortMessages);
		this.NotifyListeners();
	}

	/**
	 * In the future, this will be made into Observables. Maybe sooner than later.
	 * @param cb 
	 */
	public RegisterListener(cb: MessageCallback) {
		this.MessageUpdateListeners.push(cb);
	}

	private SortMessages(a: Message, b: Message) {
		if(a.ClientReceived === null || b.ClientReceived === null) {
			throw new Error('Message client received cannot be null on the client');
		}

		// Sort by when the Client received the message first
		// Then sort by Id
		// If there is no Id, let the one that has an Id be sent first
		// Otherwise it doesn't matter
		if(a.ClientReceived < b.ClientReceived) {
			return -1;
		} else if(a.ClientReceived > b.ClientReceived) {
			return 1;
		}

		if(a.MessageId === null) {
			return 1;
		}

		if(b.MessageId === null) {
			return 1;
		}

		if(a.MessageId < b.MessageId) {
			return -1;
		}

		return 1;
	}

	private NotifyListeners(): void {
		for(let listenerCallback of this.MessageUpdateListeners) {
			listenerCallback(this.messages);
		}
	}
}