import { createElement } from 'harmony-ui';

export class Statusbar {
	#htmlElement!: HTMLElement;

	#initHTML() {
		this.#htmlElement = createElement('div', {
			class: 'statusbar',
			innerText: 'this is the statusbar',
		});
		return this.#htmlElement;

	}

	get htmlElement() {
		return this.#htmlElement ?? this.#initHTML();
	}
}
