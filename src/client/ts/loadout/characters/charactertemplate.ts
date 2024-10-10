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

		const slots = new Map();

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

	getModelName(modelID) {
		return this.#definition[`Model${modelID}`] ?? this.#definition.Model;
	}

	getAdjective(name) {
		return this.#definition.Adjectives?.[name];
	}
}
