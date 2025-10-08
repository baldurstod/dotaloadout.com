import { OptionsManager } from 'harmony-browser-utils';
import { createElement, createShadowRoot, HarmonySwitchChange, HTMLHarmonySwitchElement, I18n } from 'harmony-ui';
import unitSelectorCSS from '../../css/unitselector.css';
import { Controller } from '../controller';
import { CharacterSelected, EVENT_CHARACTER_SELECTED, EVENT_CHARACTER_UNITS_CHANGED } from '../controllerevents';
import { Character } from '../loadout/characters/character';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { Units } from '../loadout/misc/units';

export class UnitSelector {
	#shadowRoot?: ShadowRoot;
	#htmlUnits?: HTMLElement;
	#character?: Character;
	#items = new Map();

	constructor() {
		Controller.addEventListener(EVENT_CHARACTER_UNITS_CHANGED, () => this.#refreshUnits());
		Controller.addEventListener(EVENT_CHARACTER_SELECTED, event => this.#handleCharacterSelected((event as CustomEvent<CharacterSelected>).detail.characterId));
	}

	#refreshUnits() {
		if (!this.#character) {
			return;
		}

		const units = this.#character.getUnits();
		this.#htmlUnits?.replaceChildren();
		for (const [unitID, _] of units) {
			this.#createUnitSelector(unitID);
		}

		const modelCount = this.#character.getModelCount();
		if (modelCount > 1) {
			this.#createModelSelector(modelCount);
		}
	}

	#handleCharacterSelected(characterId: string) {
		this.#character = CharacterManager.getCharacter(characterId);
		this.#refreshUnits();
	}

	#createUnitSelector(unitID: string): void {
		const sw = createElement('harmony-switch', {
			class: 'unit',
			'data-i18n': Units.getName(unitID),
			parent: this.#htmlUnits,
			events: {
				change: (event: CustomEvent<HarmonySwitchChange>) => OptionsManager.setSubItem('app.units.display', unitID, event.detail.state),
			},
		}) as HTMLHarmonySwitchElement;

		(async () => {
			sw.checked = (await OptionsManager.getSubItem('app.units.display', unitID)) as boolean;
		})()
	}

	#createModelSelector(modelCount: number) {
		createElement('div', {
			parent: this.#htmlUnits,
			childs: [
				createElement('label', {
					i18n: '#model',
				}),
				createElement('input', {
					class: 'unit',
					type: 'range',
					min: 0,
					max: modelCount - 1,
					steap: 1,
					value: this.#character?.getModelId(),
					events: {
						input: (event: Event) => this.#character?.setModelId(Number((event.target as HTMLInputElement).value)),
						//OptionsManager.setSubItem('app.units.display', unitID, event.target.checked),
					},
					//checked: OptionsManager.getSubItem('app.units.display', unitID),
				}),
			]
		});
	}

	#initHTML() {
		this.#shadowRoot = createShadowRoot('div', {
			adoptStyle: unitSelectorCSS,
			childs: [
				this.#htmlUnits = createElement('div', { class: 'units' }),
			]
		});
		I18n.observeElement(this.#shadowRoot);
		return this.#shadowRoot.host;
	}

	get htmlElement() {
		return this.#shadowRoot?.host ?? this.#initHTML();
	}
}
