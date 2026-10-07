import { createElement } from 'harmony-ui';
import { Dota2Item } from 'loadout';
import { DOTA2_MARKET_LISTINGS } from '../constants';
import { Controller, ControllerEvent } from '../controller';

export class MarketPrices {
	#htmlElement!: HTMLElement;

	constructor() {
		Controller.addEventListener(ControllerEvent.SetMarketPrices, (event: Event) => {
			this.#htmlElement.innerText = '';
			for (const [item, price] of (event as CustomEvent<Map<Dota2Item, string>>).detail) {
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

	#initHTML(): HTMLElement {
		this.#htmlElement = createElement('div', {
			class: 'market-prices',
		});
		return this.#htmlElement;
	}

	get htmlElement(): HTMLElement {
		return this.#htmlElement ?? this.#initHTML();
	}
}
