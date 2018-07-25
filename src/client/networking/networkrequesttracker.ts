import DeferredPromise from "../../shared/deferredpromise.js";
import { IVClientRequestDTO } from "../../shared/networkmodels/vclientrequest.js";
import { SOCKET_READY_STATE } from "./socketstateenum.js";

export class VClientRequestTracker<TRequest, TResponse> {
	private DeferredPromise: DeferredPromise<TResponse>;

	constructor(
		private RequestId: number, 
		private RequestData: TRequest,
		private HasSent: boolean,
		) {
			this.DeferredPromise = new DeferredPromise();
	}

	public GetRequestId(): number {
		return this.RequestId;
	}
	public GetHasSent(): boolean {
		return this.HasSent;
	}

	public GetRequestData(): TRequest {
		return this.RequestData;
	}

	public GetPromise(): Promise<TResponse> {
		return this.DeferredPromise.Promise;
	}

	public ResolveRequest(responseData: TResponse, requestTrackers: Array<VClientRequestTracker<any, any>>): void {
		this.DeferredPromise.deferredResolve(responseData);
		requestTrackers.splice(requestTrackers.indexOf(this), 1);
	}

	public SendRequest(clientId: number, websocket: WebSocket): void {
		if (websocket.readyState !== SOCKET_READY_STATE.OPEN) {
			throw new Error("Cannot send request tracker if the websocket is not currently open");
		}

		this.HasSent = true;
		const requestDTO: IVClientRequestDTO<TRequest> = {
			ClientId: clientId,
			RequestData: this.GetRequestData(),
			RequestId: this.GetRequestId(),
		};

		const stringified = JSON.stringify(requestDTO);

		// simulate network latency
		const randomTimeout = Math.random() * 3000;
		setTimeout(() => {
			websocket.send(stringified);
		}, randomTimeout);
	}
}
