
/**
 * https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements
 * 
 * https://www.webcomponents.org/community/articles/web-components-best-practices
 * 
 * https://developers.google.com/web/fundamentals/web-components/best-practices
 */
export interface IVCustomElement {
	/**
	 * Invoked when the custom element is first connected to the document's DOM.
	 */
	ConnectedCallback(): void;

	/**
	 * Invoked when the custom element is disconnected from the document's DOM.
	 */
	DisconnectedCallback(): void;

	/**
	 * Invoked when the custom element is moved to a new document.
	 * 
	 * https://stackoverflow.com/questions/50995139/when-does-webcomponent-adoptedcallback-fire
	 * 
	 * TL&DR, don't worry about implementing this
	 * 
	 * adoptedCallback(): void;
	 */
	
	/**
	 * Invoked when one of the custom element's attributes is added, removed, or changed.
	 */
	AttributeChangedCallback(): void;
}
