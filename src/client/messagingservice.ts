import { Message } from '../shared/message';
import { NetworkingSocketService } from './networking/networkingsocketservice.js';


export class MessagingService {
	private messages: Message[] = [];
	private networkingSocketService: NetworkingSocketService;

	public OnMessageUpdateCBS: Function[] = [];

	constructor() {
		this.networkingSocketService = new NetworkingSocketService();
	}

	public async SendMessage(message: Message): Promise<void> {
		let res = await this.networkingSocketService.SendData<Message, Message>(message);
		this.messages.push(res);
		for(let cb of this.OnMessageUpdateCBS) {
			cb(this.messages);
		}
	}

	/**
	 * In the future, this will be made into Observables. Maybe sooner than later.
	 * @param cb 
	 */
	public RegisterCB(cb: Function) {
		this.OnMessageUpdateCBS.push(cb);
	}
}