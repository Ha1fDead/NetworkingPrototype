/**
 * Helper class that enables you to "Resolve" a promise OUTSIDE of the promise constructor
 */
export default class DeferredPromise<TResolve> {
	public Promise: Promise<TResolve>;
	public deferredResolve!: (value: TResolve | PromiseLike<TResolve> | undefined) => void;
	public deferredReject!: (reason: any) => void;

	constructor() {
		this.Promise = new Promise<TResolve>((resolve, reject) => {
			this.deferredResolve = resolve;
			this.deferredReject = reject;
		});
	}
}
