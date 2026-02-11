import { createElement } from 'harmony-ui';
import { Controller } from '../controller';
import { EVENT_SET_MARKET_PRICES } from '../controllerevents';

import { DOTA2_MARKET_LISTINGS } from '../constants';

export class MarketPrices {
	#htmlElement!: HTMLElement;

	constructor() {
		Controller.addEventListener(EVENT_SET_MARKET_PRICES, event => {
			this.#htmlElement.innerText = '';
			const prices = (event as CustomEvent).detail;
			for (const [item, price] of (event as CustomEvent).detail) {
				createElement('a', {
					parent: this.#htmlElement,
					target: '_blank',
					class: 'price',
					href: encodeURI(DOTA2_MARKET_LISTINGS + item.name),
					innerText: item.name + ': ' + price,
				});
			}
		});
	}

	#initHTML() {
		this.#htmlElement = createElement('div', {
			class: 'market-prices',
		});
		return this.#htmlElement;
	}

	get htmlElement() {
		return this.#htmlElement ?? this.#initHTML();
	}
}
