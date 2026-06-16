import { Item } from './items/item';

export type AssetModifierJSON = {
	modifier?: string,
	type?: string,
	style?: string,
	asset?: string,
	level?: string,
	persona?: string,
	skin?: string,
	loadout_default_offset?: string,
	value?: string,
}

export class AssetModifier {
	#item: Item | null;
	#definition: AssetModifierJSON;

	constructor(item: Item | null, definition: AssetModifierJSON) {
		this.#item = item;
		this.#definition = definition;
	}

	get item() {
		return this.#item;
	}

	get type() {
		return this.#definition.type;
	}

	get asset() {
		return this.#definition.asset;
	}

	get modifier() {
		return this.#definition.modifier;
	}

	get persona() {
		return this.#definition.persona;
	}

	get skin() {
		return this.#definition.skin;
	}

	get style() {
		return this.#definition.style ?? 0;
	}

	get loadoutDefaultOffset() {
		return this.#definition.loadout_default_offset;
	}

	get level() {
		return this.#definition.level;
	}

	get value() {
		return this.#definition.value;
	}
}
