import { DOTA2_REPOSITORY, ITEM_GAME_PATH } from '../../constants';
import { Controller } from '../../controller';
import { EVENT_CHARACTERS_LOADED, EVENT_CHARACTER_SELECTED, EVENT_ITEMS_LOADED } from '../../controllerevents';
import { Units } from '../misc/units';
import { ItemTemplates } from './itemtemplates';


export class ItemManager {
	static #characterTemplates = new Map();
	static #characters = new Map();
	static #currentCharacter;
	static #itemsPerCharacter = new Map();
	static #lang = 'english';

	static async #loadItems(characterId) {
		let items = this.#itemsPerCharacter.get(characterId);
		if (items) {
			return items;
		}

		items = new Promise(async resolve => {
			const response = await fetch(new URL(`${ITEM_GAME_PATH}${characterId}.json`, DOTA2_REPOSITORY));

			if (!response) {
				return false;
			}

			const itemsJSON = await response.json();
			if (!itemsJSON) {
				return false;
			}

			const characterItems = new Set();

			for (const item of itemsJSON) {
				ItemTemplates.addTemplate(item);
				characterItems.add(item.id);
			}

			Controller.dispatchEvent(new CustomEvent(EVENT_ITEMS_LOADED, { detail: { characterId: characterId } }));
			resolve(characterItems);
		});


		this.#itemsPerCharacter.set(characterId, items);

		return items;
	}

	static async #loadNeutralCreeps(characterId) {
		const items = new Set();
		for (const [key, unit] of Units.getUnits()) {
			if (unit.IsNeutralUnitType == '1' && unit.ConsideredHero != '1') {
				const item = {
					id: key,
					name: unit.name,
					slot: 'neutral_creeps',
					assetmodifiers:[
						{
							"asset": characterId,
							"modifier": unit.Model,
							"type": "entity_model"
						},
					],
				}

				ItemTemplates.addTemplate(item);
				items.add(key);
			}
		}

		return items;
	}

	static async getItems(characterId) {
		if (characterId === 'neutralcreeps') {
			return this.#loadNeutralCreeps(characterId);
		} else {
			return this.#loadItems(characterId);
		}
	}

	static async getBaseItemId(characterId, slot) {
		const items = await this.#loadItems(characterId);
		if (!items) {
			return;
		}
		for (const itemId of items) {
			const item = ItemTemplates.getTemplate(itemId);
			if (item?.isBaseItem && item?.slot == slot) {
				return itemId;
			}
		}
	}
};
