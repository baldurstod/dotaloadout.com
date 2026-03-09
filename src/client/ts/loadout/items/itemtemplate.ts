import { JSONObject } from 'harmony-types';

export class ItemTemplate {
	#definition;

	constructor(definition: JSONObject) {
		this.#definition = definition;
	}

	get name() {
		return this.#definition.name;
	}

	get imageInventory() {
		return this.#definition.imageInventory;
	}

	get slot(): string {
		return (this.#definition.slot as string)?.toLowerCase();
	}

	get id() {
		return this.#definition.id;
	}

	getModelName(styleId: number, model: number = 0) {
		const style = (this.#definition.styles as JSONObject)?.[styleId] as JSONObject;
		if (model == 0) {
			return style?.model_player ?? this.#definition.modelPlayer;
		} else {
			return style?.['model_player' + model] ?? style?.model_player ?? this.#definition['modelPlayer' + model] ?? this.#definition.modelPlayer;
		}
	}

	get repository() {
		return this.#definition.repository;
	}

	get isBaseItem() {
		return this.#definition.baseItem == 1;
	}

	get bundle() {
		return this.#definition.bundle;
	}

	get assetModifiers() {
		return this.#definition.assetmodifiers;
	}

	get rarity() {
		return this.#definition.rarity;
	}

	get skin() {
		return this.#definition.skin;
	}

	getSkin(styleId: number) {
		const style = (this.#definition.styles as JSONObject)?.[styleId] as JSONObject;
		return style?.skin ?? this.#definition.skin;

	}

	hasStyles() {
		return Object.keys(this.#definition.styles ?? {}).length > 1;
	}

	getStyle(styleId: number) {
		return (this.#definition.styles as JSONObject)?.[styleId] as JSONObject;
	}

	getStyles() {
		const ret = new Map<string, JSONObject>();
		const styles = this.#definition.styles as JSONObject;
		if (styles) {
			for (const styleId in styles) {
				ret.set(styleId, styles[styleId] as JSONObject);
			}
		}
		return ret;
	}
}
