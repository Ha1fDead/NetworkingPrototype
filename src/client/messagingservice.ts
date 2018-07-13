import { Message } from '../shared/message';
import { NetworkingSocketService } from './networking/networkingsocketservice.js';


export class MessagingService {
	private messages: Message[] = [];
	private networkingSocketService: NetworkingSocketService;

	constructor() {
		this.networkingSocketService = new NetworkingSocketService();
	}

	public async SendMessage(message: Message): Promise<void> {
		let res = await this.networkingSocketService.SendData<Message, Message>(message);
		console.log('in service, got', res);
	}
}