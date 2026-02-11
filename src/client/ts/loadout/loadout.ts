import { customFetch } from 'harmony-3d';
import { JSONObject } from 'harmony-types';
import { DOTA2_REPOSITORY, ITEM_GAME_PATH } from '../constants';
import { Controller } from '../controller';

class LoadoutClass {// TODO: turn into a static class
	static #instance: LoadoutClass;
	#initItemsPromise!: Promise<boolean>;
	#initialized = false;
	#json!: JSONObject;
	#characters = new Set();
	#lang = 'english';
	constructor() {
		if (LoadoutClass.#instance) {
			return LoadoutClass.#instance;
		}
		LoadoutClass.#instance = this;
	}

	setLang(lang: string) {
		this.#lang = lang;
	}

	#init() {
		if (!this.#initItemsPromise) {

			this.#initItemsPromise = new Promise<boolean>(async (resolve, reject) => {
				const response = await customFetch(new URL(`${ITEM_GAME_PATH}items_${this.#lang}.json`, DOTA2_REPOSITORY));

				if (!response || !response.ok) {
					resolve(false);
					return;
				}

				const json = await response.json();
				if (json) {
					this.#json = json;
					//this.#loadItems();
					Controller.dispatchEvent(new CustomEvent('itemsloaded'));
				}
				resolve(true);
			});
		}
		return this.#initItemsPromise;
	}

	async getCustomPlayers() {
		await this.#init();

		return this.#characters;
	}
};

export const Loadout = new LoadoutClass();
