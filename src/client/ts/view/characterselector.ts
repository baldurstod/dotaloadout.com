import { OptionsManager, OptionsManagerEvents } from 'harmony-browser-utils/';
import { createElement, hide, show } from 'harmony-ui';
import { Controller } from '../controller';
import { CharacterSelected, EVENT_CHARACTER_SELECTED } from '../controllerevents';
import { CharacterTemplate } from '../loadout/characters/charactertemplate';
import { CharacterTemplates } from '../loadout/characters/charactertemplates';
import { createCharacterElement } from './utils/createcharacterelement';

const FILTER_METHOD = 'app.heroselector.filter.method'
const SORT_FIELD = 'app.heroselector.sort.field'

export class CharacterSelector {
	#htmlElement;
	#htmlCharacters = new Map<CharacterTemplate, HTMLElement>();
	#characters = new Set();
	#filters = { name: '' };
	#htmlCharactersContainer;
	#htmlNameContainer;
	#htmlNameContainerTimeout;
	#htmlFilterName;
	#initialized = false;
	#css = createElement('style');
	#sortField;
	#htmlSortField;
	constructor() {
		this.#setFilterMethod(OptionsManager.getItem(FILTER_METHOD));
		OptionsManagerEvents.addEventListener(FILTER_METHOD, (event: CustomEvent) => this.#setFilterMethod(event.detail.value));

		this.#setSortField(OptionsManager.getItem(SORT_FIELD));
		OptionsManagerEvents.addEventListener(SORT_FIELD, (event: CustomEvent) => this.#setSortField(event.detail.value));
	}

	#initHTML() {
		this.#htmlElement = createElement('div', {
			class: 'character-selector',
			childs: [
				this.#css,
				createElement('div', {
					class: 'filter-container',
					childs: [
						this.#htmlFilterName = createElement('input', {
							class: 'characters-filter-name',
							events: {
								keyup: event => this.#setNameFilter(event.target.value)
							},
						}),
						this.#htmlSortField = createElement('select', {
							class: 'characters-sort-field',
							childs: [
								createElement('option', { innerText: 'name' }),
								createElement('option', { innerText: 'order' }),
								createElement('option', { innerText: 'female' }),
							],
							value: this.#sortField,
							events: {
								change: event => OptionsManager.setItem(SORT_FIELD, event.target.value),//this.#setNameFilter(event.target.value)
							},
						}),
					],
				}),
				this.#htmlCharactersContainer = createElement('div', {
					class: 'character-selector-characters',
				}),
				this.#htmlNameContainer = createElement('div', {
					class: 'character-selector-filter-name',
				}),
			],
			events: {
				click: event => { if (event.target == event.currentTarget) { this.hide(); } },
			}
		});
		return this.#htmlElement;
	}

	#init() {
		const characterTemplates = CharacterTemplates.getTemplates();
		let characterElement;
		for (const [characterId, characterTemplate] of characterTemplates) {
			this.#htmlCharactersContainer.append(
				characterElement = createCharacterElement(characterTemplate),
			);
			this.#htmlCharacters.set(characterTemplate, characterElement);
			characterElement.addEventListener('click', () => this.#selectCharacter(characterId));
		}
		this.#initialized = true;
		this.#sort();
	}

	#selectCharacter(characterId: string) {
		Controller.dispatchEvent(new CustomEvent<CharacterSelected>(EVENT_CHARACTER_SELECTED, { detail: { characterId: characterId } }));
		this.hide();
	}

	get htmlElement() {
		return this.#htmlElement ?? this.#initHTML();
	}

	show() {
		if (!this.#initialized) {
			this.#init();
		}
		show(this.#htmlElement);
		this.#htmlFilterName.focus();
		this.#htmlFilterName.select();
	}

	hide() {
		hide(this.#htmlElement);
	}

	#setNameFilter(name) {
		this.#filters.name = name.toLowerCase();
		this.#updateFilters();
		this.#htmlNameContainer.innerText = name;
		clearTimeout(this.#htmlNameContainerTimeout);
		this.#htmlNameContainerTimeout = setTimeout(() => this.#htmlNameContainer.innerText = '', 2000);
	}

	#updateFilters() {
		for (const [characterTemplate, characterHtml] of this.#htmlCharacters) {
			if (this.#matchFilter(characterTemplate)) {
				//show(characterHtml);
				characterHtml.classList.remove('filtered');
			} else {
				characterHtml.classList.add('filtered');
				//hide(characterHtml);
			}
		}
	}

	#matchFilter(characterTemplate) {
		const nameFilter = this.#filters.name;
		if (nameFilter) {
			/*if (characterTemplate.name != slotFilter) {
				return false;
			}*/
			if (characterTemplate.name.toLowerCase().indexOf(nameFilter) == -1) {
				return false;
			}
		}
		return true;
	}

	#setFilterMethod(filterMethod) {
		if (filterMethod == 'hide') {
			this.#css.textContent = '.character-selector-character.filtered{display: none;}';
		} else {
			this.#css.textContent = '';
		}
	}

	#setSortField(sortField) {
		if (this.#htmlSortField) {
			this.#htmlSortField.value = sortField;
		}
		this.#sortField = sortField;
		console.log('sort field: ', sortField)
		this.#sort();
	}

	#sort() {
		const that = this;
		this.#htmlCharacters[Symbol.iterator] = function* () {
			yield* [...this.entries()].sort(
				(a, b) => {
					const templateA = a[0];
					const templateB = b[0];

					if (templateA.isHero() !== templateB.isHero()) {
						if (templateA.isHero()) {
							return -1;
						} else {
							return 1;
						}
					}

					switch (that.#sortField) {
						case 'order':
							return templateA.heroOrderId - templateB.heroOrderId;
						case 'female':
							const femaleA = Number(templateA.getAdjective('Female') ?? 0);
							const femaleB = Number(templateB.getAdjective('Female') ?? 0);
							if (femaleA != femaleB) {
								return femaleB - femaleA;
							}
							break;
					}
					// By default, sort by name
					return templateA.name.localeCompare(templateB.name);
				}
			);
		}

		for (let [_, htmlCharacter] of this.#htmlCharacters) {
			this.#htmlCharactersContainer.append(htmlCharacter);
		}
	}
}
