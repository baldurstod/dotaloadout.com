import { OptionsManager } from 'harmony-browser-utils';

import { DOTA2_MARKET_PRICES_PATH } from '../constants';

export class MarketPrice {
	static #prices = {};
	static #currency = 'USD';
	static #dirtyPrices = true;
	static #priceTimeout: NodeJS.Timeout;

	static async #requestPrices(force = false) {
		if (force || this.#dirtyPrices) {
			clearTimeout(this.#priceTimeout);
			this.#dirtyPrices = false;
			this.#priceTimeout = setTimeout(() => this.#requestPrices(true), 15 * 60 * 1000);
			let url = DOTA2_MARKET_PRICES_PATH + this.#currency + '.json';
			let response = await fetch(url);//.then((response) => response.json().then((json) => this.initPrices(json)));//fetch(url).then((response) => response.json().then((json) => this.initPrices(json)));
			let json = await response.json();
			this.#initPrices(json);
		}
	}

	static #initPrices(prices) {
		this.#prices = Object.create(null);
		if (prices) {
			for (var i = 0; i < prices.length; i++) {
				var price = prices[i];
				if (price.length >= 5) {
					if (price[1] == 4 || this.#prices[price[0]] == undefined) {
						this.#prices[price[0]] = price[4] / 100;
					}
				}
			}
		}
	}

	static async setCurrency(currency = 'USD') {
		this.#currency = currency;
		await this.#requestPrices(true);
	}

	static async getPrice(id) {
		if (!OptionsManager.getItem('app.market.automarket')) {
			return;
		}
		await this.#requestPrices();

		let price = this.#prices[id];
		if (price) {
			return this.formatPrice(price);
		}
	}


	static formatPrice(price) {
		switch (this.#currency) {
			case 'EUR':
				return price + '€';
			case 'USD':
				return '$' + price;
			case 'JPY':
				return 'JP¥ ' + Math.round(price);
			case 'GBP':
				return '£' + price;
			case 'RUB':
				return price + ' ₽';
			case 'CNY':
				return 'CN¥ ' + price;
			case 'NOK':
				return price + ' kr';
			case 'NZD':
				return 'NZ$ ' + price;
			case 'CAD':
				return 'CDN$ ' + price;
		}
	}
}
