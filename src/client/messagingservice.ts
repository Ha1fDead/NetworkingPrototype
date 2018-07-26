import { IMessage, IMessageDTOFromClient, IMessageDTOFromServer } from "../shared/message";
import { ServerActionRPC } from "./../shared/networkmodels/serveractionenum.js";
import { NetworkingSocketService } from "./networking/networkingsocketservice.js";
import { INetworkListener } from "./networking/networklistener";

type MessageCallback = (m: IMessage[]) => void;

export class MessagingService implements INetworkListener<IMessage[]> {
	public MessageUpdateListeners: MessageCallback[] = [];

	private messages: IMessage[] = [];

	constructor(
		private networkingSocketService: NetworkingSocketService) {
		this.networkingSocketService.RegisterListener(this);
	}
	
	public GetActionsHandledBy(): ServerActionRPC {
		return ServerActionRPC.UpdateMessages;
	}

	public HandleUpdate(data: IMessage[]): void {
		const now = new Date();
		for (const message of data.filter((msg) => msg.ClientReceived === null)) {
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

	public async SendMessage(message: string): Promise<void> {
		const messageToSend: IMessageDTOFromClient = {
			ClientSent: new Date(),
			Contents: message,
		};

		const clientMessage: IMessage = {
			ClientReceived: new Date(),
			ClientSent: messageToSend.ClientSent,
			Contents: message,
			MessageId: null,
			SenderId: 1,
			ServerReceived: null,
		};
		
		this.messages.push(clientMessage);
		this.messages.sort(this.SortMessages);
		this.NotifyListeners();

		const res = await this.networkingSocketService.SendData<IMessageDTOFromClient, IMessageDTOFromServer>(messageToSend);

		clientMessage.SenderId = res.SenderId;
		clientMessage.ServerReceived = res.ServerReceived;
		clientMessage.MessageId = res.MessageId;

		this.NotifyListeners();
	}

	private NotifyListeners(): void {
		for (const listenerCallback of this.MessageUpdateListeners) {
			listenerCallback(this.messages);
		}
	}

	private SortMessages(a: IMessage, b: IMessage) {
		if (a.ClientReceived === null || b.ClientReceived === null) {
			throw new Error("Message client received cannot be null on the client");
		}

		// Sort by when the Client received the message first
		// Then sort by Id
		// If there is no Id, let the one that has an Id be sent first
		// Otherwise it doesn't matter
		if (a.ClientReceived < b.ClientReceived) {
			return -1;
		} else if (a.ClientReceived > b.ClientReceived) {
			return 1;
		}

		if (a.MessageId === null) {
			return 1;
		}

		if (b.MessageId === null) {
			return 1;
		}

		if (a.MessageId < b.MessageId) {
			return -1;
		}

		return 1;
	}
}
