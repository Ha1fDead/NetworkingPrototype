import { ServerActionRPC } from './../../shared/networkmodels/serveractionenum.js';

/**
 * More or less RxJS pattern
 */
export interface Subject<TListen> {
	RegisterListener(callback: TListen): void;

	UnregisterListener(id: number): void;
}

/**
 * More or less RxJS pattern
 */
export interface Observable<TObserve> {
	HandleUpdate(data: TObserve): void;
}

/**
 * Handles receiving data for a segment of business logic
 * 
 * These are registered into the NetworkingSocketService
 * 
 * How does this interact with Serializers / Deserializers?
 */
export interface NetworkListener<TServerPayload> extends Observable<TServerPayload>{
	GetActionsHandledBy(): ServerActionRPC;
}