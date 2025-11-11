import { JSONObject } from 'harmony-utils';

export type CharacterSlot = {
	DisplayInLoadout?: string,
	SlotIndex: string,
	SlotName: string,
	SlotText: string,
	GeneratesUnits: { [key: string]: string }/*TODO: fix type*/,
}

export class CharacterTemplate {
	#definition: JSONObject;

	constructor(definition: JSONObject) {
		this.#definition = definition;
	}

	get name() {
		return this.#definition.Name;
	}

	get id() {
		return this.#definition.ID;
	}

	get heroOrderId() {
		return Number(this.#definition.HeroOrderID);
	}

	get itemSlots() {
		const itemSlots = this.#definition.ItemSlots as JSONObject;
		if (!itemSlots) {
			return;
		}

		const slots = new Map<string, CharacterSlot>();

		for (const slotName in itemSlots) {
			const slot = itemSlots[slotName] as JSONObject;
			const slotLowerCase = (slot.SlotName as string).toLowerCase();
			slots.set(slotLowerCase, {
				...(slot.DisplayInLoadout !== undefined) && { DisplayInLoadout: slot.DisplayInLoadout as string },
				SlotIndex: slot.SlotIndex as string,
				SlotName: slotLowerCase,
				SlotText: slot.SlotText as string,
				GeneratesUnits: slot.GeneratesUnits as { [key: string]: string },
			});
		}
		return slots;
	}

	isHero() {
		return this.#definition['is_hero'];
	}

	getModelCount(): number {
		let i = 0;
		for (; i == 0 || this.#definition[`Model${i}`];) {
			++i;
		}
		return i;
	}

	getModelName(modelID: number) {
		return this.#definition[`Model${modelID}`] ?? this.#definition.Model;
	}

	getAdjective(name: string) {
		return (this.#definition.Adjectives as { [key: string]: string })?.[name];
	}
}
