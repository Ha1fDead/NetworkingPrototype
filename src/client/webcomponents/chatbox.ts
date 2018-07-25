import { NetworkingSocketService } from './../networking/networkingsocketservice.js';
import { Message, MessageDTOFromClient } from '../../shared/message.js';
import { MessagingService } from '../messagingservice.js';
import { VCustomElement } from './vcustomelement.js';
const chatTemplate = document.createElement('template');
chatTemplate.innerHTML = `
	<div id="chatbox">
		<p>Id, sent, received, contents</p>
		<ul id="chatlist">
		</ul>

		<input type="text" />
	</div>
`;

const chatCSS = document.createElement('style');
chatCSS.textContent = `
	#chatlist {
		max-height: 400px;
		width: 650px;
		overflow-y: scroll;
	}
`;

// Unknown - how to handle dependencies in web components?
	// chatbox will need access to the ChatService
	// but I don't think they can take in anything in the constructor
	// https://github.com/w3c/webcomponents/issues/605
// todo -- figure out inversion of control && dependency handling w/ webcomponents
export default class ChatBox extends HTMLElement implements VCustomElement {
	private messagingService: MessagingService;

	constructor() {
		super();

		let shadow = this.attachShadow({ mode: 'open' });
		shadow.appendChild(chatTemplate.content.cloneNode(true));
		shadow.appendChild(chatCSS.cloneNode(true));
		let textInput = <HTMLInputElement>(<ShadowRoot>this.shadowRoot).querySelector('input');
		textInput.onkeypress = (event: KeyboardEvent) => {
			if(event.key === "Enter") {
				event.preventDefault();
				let fullText = textInput.value;
				textInput.value = '';
				this.HandleSubmitMessage(fullText);
			}
		};

		let networkingService = new NetworkingSocketService();
		this.messagingService = new MessagingService(networkingService);
		this.messagingService.RegisterListener(this.OnMessagesUpdate.bind(this));
	}

	private OnMessagesUpdate(messages: Message[]): void {
		let ulElement = <HTMLUListElement>(<ShadowRoot>this.shadowRoot).querySelector('ul');
		while (ulElement.firstChild) {
			ulElement.removeChild(ulElement.firstChild);
		}

		for(let msg of messages) {
			let li = document.createElement('li');
			li.innerText = `${msg.MessageId} - ${msg.ClientSent} - ${msg.ServerReceived} - ${msg.Contents}`;
			ulElement.appendChild(li);
		}
	}

	HandleSubmitMessage(message: string): void {
		this.messagingService.SendMessage(message);
	}

	ConnectedCallback(): void {
		console.log('connected');
	}
	DisconnectedCallback(): void {
		console.log('disconnected');
	}
	AttributeChangedCallback(): void {
		console.log('attribute changed');
	}
}

customElements.define('v-chat-box', ChatBox);