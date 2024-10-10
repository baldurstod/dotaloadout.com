import { createElement } from 'harmony-ui';
import { OptionsManager } from 'harmony-browser-utils/src/optionsmanager';
import { Controller } from '../controller';
import { EVENT_CHARACTER_SELECTED, EVENT_CHARACTER_UNITS_CHANGED } from '../controllerevents';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { Units } from '../loadout/misc/units';

import unitSelectorCSS from '../../css/unitselector.css';

export class UnitSelector {
	#htmlElement;
	#htmlUnits;
	#character;
	#items = new Map();

	constructor() {
		Controller.addEventListener(EVENT_CHARACTER_UNITS_CHANGED, event => this.#refreshUnits());
		Controller.addEventListener(EVENT_CHARACTER_SELECTED, event => this.#handleCharacterSelected((event as CustomEvent).detail.characterId));
	}

	#refreshUnits() {
		if (!this.#character) {
			return;
		}

		const units = this.#character.getUnits();
		this.#htmlUnits.replaceChildren();
		for (const [ unitID, _ ] of units) {
			this.#createUnitSelector(unitID);
		}
	}

	#handleCharacterSelected(characterId) {
		this.#character = CharacterManager.getCharacter(characterId);
		this.#refreshUnits();
	}

	#createUnitSelector(unitID) {
		createElement('harmony-switch', {
			class: 'unit',
			'data-i18n': Units.getName(unitID),
			parent: this.#htmlUnits,
			events: {
				change: event => OptionsManager.setSubItem('app.units.display', unitID, event.target.checked),
			},
			checked: OptionsManager.getSubItem('app.units.display', unitID),
		});
	}

	#initHTML() {
		this.#htmlElement = createElement('div', {
			attachShadow: { mode: 'closed' },
			adoptStyle: unitSelectorCSS,
			childs: [
				this.#htmlUnits = createElement('div', { class: 'units' }),
			]
		});
		return this.#htmlElement;
	}

	get htmlElement() {
		return this.#htmlElement ?? this.#initHTML();
	}
}
