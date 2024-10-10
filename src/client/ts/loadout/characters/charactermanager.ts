import { CharacterTemplates } from './charactertemplates';
import { DOTA2_HEROES_URL } from '../../constants';
import { Controller } from '../../controller';
import { EVENT_CHARACTERS_LOADED, EVENT_CHARACTER_SELECTED, EVENT_ITEM_CLICK, EVENT_REMOVE_ITEM, EVENT_SET_MARKET_PRICES, EVENT_TOOLBAR_ACTIVITY_MODIFIERS, EVENT_TOOLBAR_ACTIVITY_SELECTED } from '../../controllerevents';
import { Character } from './character';
import { ItemManager } from '../items/itemmanager';
import { ItemTemplates } from '../items/itemtemplates';
import { Units } from '../misc/units';
import { MarketPrice } from '../marketprice';
import { OptionsManager } from 'harmony-browser-utils/src/optionsmanager';

import world from '../../../json/datas/world.json';

export class CharacterManager {
	static #characterTemplates = new Map();
	static #characters = new Map();
	static #currentCharacter;

	static {
		Controller.addEventListener(EVENT_CHARACTER_SELECTED, event => this.#characterSelected((event as CustomEvent).detail.characterId));
		Controller.addEventListener(EVENT_ITEM_CLICK, event => this.#handleItemClick((event as CustomEvent).detail));
		Controller.addEventListener(EVENT_REMOVE_ITEM, event => this.#removeItem((event as CustomEvent).detail.character, (event as CustomEvent).detail.itemID));
		Controller.addEventListener(EVENT_TOOLBAR_ACTIVITY_SELECTED, event => this.#currentCharacter?.setActivity((event as CustomEvent).detail));
		Controller.addEventListener(EVENT_TOOLBAR_ACTIVITY_MODIFIERS, event => this.#currentCharacter?.setModifiers((event as CustomEvent).detail));

		OptionsManager.addEventListener('app.characters.desaturate', () => this.#currentCharacter?.processModifiers());
		OptionsManager.addEventListener('app.items.desaturate', () => this.#currentCharacter?.processModifiers());
		OptionsManager.addEventListener('app.loadout.pedestalmodel', () => this.#currentCharacter?.processModifiers());
		OptionsManager.addEventListener('app.showpedestal', () => this.#currentCharacter?.processModifiers());
		OptionsManager.addEventListener('app.showmetamorphosis', () => this.#currentCharacter?.processModifiers());
		OptionsManager.addEventListener('app.showeffects', () => this.#currentCharacter?.processModifiers());
	}

	static async loadCharacters() {
		const response = await fetch(DOTA2_HEROES_URL);
		if (!response) {
			return false;
		}

		const json = await response.json();
		if (!json) {
			return false;
		}

		const charactersJSON = json.heroes;
		if (!charactersJSON) {
			return false;
		}

		Units.addUnits(json.units);
		Units.addUnits({
			radiant_courier: { name: 'Radiant courier' },
			dire_courier: { name: 'Dire courier' },
			radiant_courier_flying: { name: 'Radiant flying courier' },
			dire_courier_flying: { name: 'Dire flying courier' },
		});

		for (const character of charactersJSON) {
			character['is_hero'] = true;
			CharacterTemplates.addTemplate(character);
		}
		for (const worldItem of world) {
			CharacterTemplates.addTemplate(worldItem);
		}

		Controller.dispatchEvent(new CustomEvent(EVENT_CHARACTERS_LOADED));
	}

	/*static getCharacterTemplates() {
		return this.#characterTemplates;
	}*/

	static getCharacter(characterId) {
		let character = this.#characters.get(characterId);
		if (!character) {
			character = new Character(characterId);
			this.#characters.set(characterId, character);
		}
		return character;
	}

	static async #characterSelected(characterId) {
		if (this.#currentCharacter) {
			this.#currentCharacter.setVisible(false);
		}

		const character = this.getCharacter(characterId);
		this.#currentCharacter = character;
		character.setVisible(true);

		await this.#equipDefaultItems(character, await ItemManager.getItems(characterId));
		CharacterManager.refreshMarketPrices();
		return character;
	}

	static async #handleItemClick(detail) {
		const character = detail.character;
		const itemId = detail.itemId;
		const item = ItemTemplates.getTemplate(itemId);
		if (!item) {
			return;
		}

		const bundle = item.bundle;
		if (bundle) {
			character.bundleItem = item;
			for (const bundleItemName of bundle) {
				const bundleItemId = ItemTemplates.getTemplateByName(bundleItemName);
				if (bundleItemId) {
					if (!character.hasItem(bundleItemId)) {
						await character.addItem(bundleItemId);
					}
				}
			}
		} else {
			character.bundleItem = null;
			if (character.hasItem(itemId)) {
				character.removeItem(itemId);
				await character.addItem(await ItemManager.getBaseItemId(character.id, item.slot));
			} else {
				await character.addItem(itemId);
			}
		}
		CharacterManager.refreshMarketPrices();
		character.processModifiers();
	}

	static async #removeItem(character, itemId) {
		character?.removeItem(itemId);
	}

	static async #equipDefaultItems(character, itemIds) {
		if (!OptionsManager.getItem('app.characters.equipdefaultitems')) {
			character.processModifiers();
			return;
		}

		if (!character || !itemIds) {
			return;
		}

		const slots = character.itemSlots;
		for (const itemId of itemIds) {
			const itemTemplate = ItemTemplates.getTemplate(itemId);
			if (itemTemplate && itemTemplate.isBaseItem && slots.has(itemTemplate.slot)) {
				await character.addItem(itemId);
			}
		}
		character.processModifiers();
	}

	static async refreshMarketPrices() {
		let currentCharacter = this.#currentCharacter;
		if (!currentCharacter) {
			return
		}

		const items = currentCharacter.getItemsWithBundle();
		const prices = new Map();
		for (const [itemId, item] of items) {
			let price = await MarketPrice.getPrice(itemId);
			if (price) {
				prices.set(item, price);
			}
		}
		Controller.dispatchEvent(new CustomEvent(EVENT_SET_MARKET_PRICES, { detail: prices }));
	}

	static exportLoadout() {
		const loadoutJSON = { characters:[] };

		for (let [_, character] of this.#characters) {
			const loadout = character.exportLoadout();
			if (loadout) {
				loadoutJSON.characters.push(loadout);
			}
		}
		return loadoutJSON;
	}

	static async importLoadout(loadoutJSON) {
		if (loadoutJSON.characters) {
			for (let character of loadoutJSON.characters) {
				await this.#importLoadoutCharacter(character);
			}
		}
	}

	static async #importLoadoutCharacter(characterJSON) {
		const character = await this.#characterSelected(characterJSON.npc);
		if (character) {
			character.importLoadout(characterJSON);
			character.setVisible(true);
			character.processModifiers();
		}
	}
}
