export type CharacterSlot = {
	DisplayInLoadout: string,
	SlotIndex: string,
	SlotName: string,
	SlotText: string,
	GeneratesUnits: { [key: string]: string }/*TODO: fix type*/,
}

export class CharacterTemplate {
	#definition;
	constructor(definition) {
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
		const itemSlots = this.#definition.ItemSlots;
		if (!itemSlots) {
			return;
		}

		const slots = new Map<string, CharacterSlot>();

		for (const slotName in itemSlots) {
			const slot = itemSlots[slotName];
			const slotLowerCase = slot.SlotName.toLowerCase();
			slots.set(slotLowerCase, {
				...(slot.DisplayInLoadout !== undefined) && { DisplayInLoadout: slot.DisplayInLoadout },
				SlotIndex: slot.SlotIndex,
				SlotName: slotLowerCase,
				SlotText: slot.SlotText,
				GeneratesUnits: slot.GeneratesUnits,
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

	getAdjective(name) {
		return this.#definition.Adjectives?.[name];
	}
}
