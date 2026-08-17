import { createElement } from 'harmony-ui';

export class Statusbar {
	#htmlElement!: HTMLElement;

	#initHTML(): HTMLElement {
		this.#htmlElement = createElement('div', {
			class: 'statusbar',
			innerText: 'this is the statusbar',
		});
		return this.#htmlElement;

	}

	get htmlElement(): HTMLElement {
		return this.#htmlElement ?? this.#initHTML();
	}
}
