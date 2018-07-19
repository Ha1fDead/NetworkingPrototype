import { SOCKET_READY_STATE } from './socketstateenum.js';
import DeferredPromise from "../../shared/deferredpromise.js";
import { VClientRequestDTO } from '../../shared/networkmodels/vclientrequest.js';

// but then how do I contain an array of these?
export class VClientRequestTracker {
	private DeferredPromise: DeferredPromise<any>;

	constructor(
		private RequestId: number, 
		private RequestData: any,
		private HasSent: boolean
		) {
			this.DeferredPromise = new DeferredPromise();
	}

	GetRequestId(): number {
		return this.RequestId;
	}
	GetHasSent(): boolean {
		return this.HasSent;
	}

	GetRequestData<TRequest>(): TRequest {
		return this.RequestData;
	}

	GetPromise<TResponse>(): Promise<TResponse> {
		return this.DeferredPromise.Promise;
	}

	ResolveRequest<TResponse>(responseData: TResponse, requestTrackers: VClientRequestTracker[]): void {
		this.DeferredPromise.deferredResolve(responseData);
		requestTrackers.splice(requestTrackers.indexOf(this), 1);
	}

	SendRequest<TRequest>(clientId: number, websocket: WebSocket): void {
		if(websocket.readyState !== SOCKET_READY_STATE.OPEN) {
			throw new Error('Cannot send request tracker if the websocket is not currently open');
		}

		this.HasSent = true;
		let requestDTO: VClientRequestDTO<TRequest> = {
			ClientId: clientId,
			RequestId: this.GetRequestId(),
			RequestData: this.GetRequestData()
		};

		let stringified = JSON.stringify(requestDTO);
		websocket.send(stringified);
	}
}