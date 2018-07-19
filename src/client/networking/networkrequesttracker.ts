import { SOCKET_READY_STATE } from './socketstateenum.js';
import DeferredPromise from "../../shared/deferredpromise.js";
import { VClientRequestDTO } from '../../shared/networkmodels/vclientrequest.js';

export class VClientRequestTracker<TRequest, TResponse> {
	private DeferredPromise: DeferredPromise<TResponse>;

	constructor(
		private RequestId: number, 
		private RequestData: TRequest,
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

	GetRequestData(): TRequest {
		return this.RequestData;
	}

	GetPromise(): Promise<TResponse> {
		return this.DeferredPromise.Promise;
	}

	ResolveRequest(responseData: TResponse, requestTrackers: VClientRequestTracker<any, any>[]): void {
		this.DeferredPromise.deferredResolve(responseData);
		requestTrackers.splice(requestTrackers.indexOf(this), 1);
	}

	SendRequest(clientId: number, websocket: WebSocket): void {
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