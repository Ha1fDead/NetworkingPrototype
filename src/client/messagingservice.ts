import { ServerActionRPC } from './../shared/networkmodels/serveractionenum.js';
import { NetworkListener } from './networking/networklistener';
import { Message } from '../shared/message';
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

	public async SendMessage(message: Message): Promise<void> {
		let res = await this.networkingSocketService.SendData<Message, Message>(message);
		this.messages.push(res);
		this.NotifyListeners();
	}

	HandleUpdate(data: Message[]): void {
		this.messages = data;
		this.NotifyListeners();
	}

	/**
	 * In the future, this will be made into Observables. Maybe sooner than later.
	 * @param cb 
	 */
	public RegisterListener(cb: MessageCallback) {
		this.MessageUpdateListeners.push(cb);
	}

	private NotifyListeners(): void {
		for(let listenerCallback of this.MessageUpdateListeners) {
			listenerCallback(this.messages);
		}
	}
}