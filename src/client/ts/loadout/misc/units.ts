export type Unit = {
	name: string;
	Model?: string;
	include_keys_from?: string;
	IsNeutralUnitType?: string;
	ConsideredHero?: string;
}

export class Units {
	static #units = new Map<string, Unit>();

	static addUnit(id, unit) {
		this.#units.set(id, unit);
	}

	static addUnits(units) {
		for (const id in units) {
			const unit = units[id];
			this.addUnit(id, unit);
		}
	}

	static getUnit(id) {
		return this.#units.get(id);
	}

	static getModel(id) {
		let unit = this.#units.get(id);
		if (!unit) {
			for (const [i, u] of this.#units) {
				if (i.startsWith(id)) {
					unit = u;
					break;
				}
			}
		}

		if (!unit) {
			return null;
		}

		if (unit.Model) {
			return unit.Model;
		}

		if (unit.include_keys_from) {
			return this.getModel(unit.include_keys_from);
		}
	}

	static getName(id) {
		let unit = this.#units.get(id);
		if (!unit) {
			for (const [i, u] of this.#units) {
				if (i.startsWith(id)) {
					//return u;
					unit = u;
					break;
				}
			}
		}

		if (!unit) {
			return null;
		}

		if (unit.name) {
			return unit.name;
		}

		if (unit.include_keys_from) {
			return this.getName(unit.include_keys_from);
		}
	}

	static getUnits() {
		return this.#units;
	}
}
