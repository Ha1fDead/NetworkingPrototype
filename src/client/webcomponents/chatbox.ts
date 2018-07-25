import { IMessage } from "../../shared/message.js";
import { MessagingService } from "../messagingservice.js";
import { NetworkingSocketService } from "./../networking/networkingsocketservice.js";
import { IVCustomElement } from "./vcustomelement.js";
const chatTemplate = document.createElement("template");
chatTemplate.innerHTML = `
	<div id="chatbox">
		<p>Id, sent, received, contents</p>
		<ul id="chatlist">
		</ul>

		<input type="text" />
	</div>
`;

const chatCSS = document.createElement("style");
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
export default class ChatBox extends HTMLElement implements IVCustomElement {
	private messagingService: MessagingService;

	constructor() {
		super();

		const shadow = this.attachShadow({ mode: "open" });
		shadow.appendChild(chatTemplate.content.cloneNode(true));
		shadow.appendChild(chatCSS.cloneNode(true));
		const textInput = (this.shadowRoot as ShadowRoot).querySelector("input") as HTMLInputElement;
		textInput.onkeypress = (event: KeyboardEvent) => {
			if (event.key === "Enter") {
				event.preventDefault();
				const fullText = textInput.value;
				textInput.value = "";
				this.HandleSubmitMessage(fullText);
			}
		};

		const networkingService = new NetworkingSocketService();
		this.messagingService = new MessagingService(networkingService);
		this.messagingService.RegisterListener(this.OnMessagesUpdate.bind(this));
	}

	public HandleSubmitMessage(message: string): void {
		this.messagingService.SendMessage(message);
	}

	public ConnectedCallback(): void {
		console.log("connected");
	}
	public DisconnectedCallback(): void {
		console.log("disconnected");
	}
	public AttributeChangedCallback(): void {
		console.log("attribute changed");
	}

	private OnMessagesUpdate(messages: IMessage[]): void {
		const ulElement = (this.shadowRoot as ShadowRoot).querySelector("ul") as HTMLUListElement;
		while (ulElement.firstChild) {
			ulElement.removeChild(ulElement.firstChild);
		}

		for (const msg of messages) {
			const li = document.createElement("li");
			li.innerText = `${msg.MessageId} - ${msg.ClientSent} - ${msg.ServerReceived} - ${msg.Contents}`;
			ulElement.appendChild(li);
		}
	}
}

customElements.define("v-chat-box", ChatBox);
