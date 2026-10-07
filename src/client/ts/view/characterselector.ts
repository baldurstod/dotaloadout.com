import { OptionsManager, OptionsManagerEvent, OptionsManagerEvents } from 'harmony-browser-utils';
import { createElement, hide, show } from 'harmony-ui';
import { Dota2HeroTemplate, Dota2HeroTemplates } from 'loadout';
import { CharacterSelected, Controller, ControllerEvent } from '../controller';
import { createCharacterElement } from './utils/createcharacterelement';

const FILTER_METHOD = 'app.heroselector.filter.method';
const SORT_FIELD = 'app.heroselector.sort.field';

export type HeroSortField = 'name' | 'order' | 'female';

export class CharacterSelector {
	#htmlElement?: HTMLElement;
	#htmlCharacters = new Map<Dota2HeroTemplate, HTMLElement>();
	#filters = { name: '' };
	#htmlCharactersContainer?: HTMLElement;
	#htmlNameContainer?: HTMLElement;
	#htmlNameContainerTimeout?: ReturnType<typeof setTimeout>;
	#htmlFilterName?: HTMLInputElement;
	#initialized = false;
	#css = createElement('style');
	#sortField: HeroSortField = 'name';
	#htmlSortField?: HTMLSelectElement;

	constructor() {
		this.#setFilterMethod(OptionsManager.getItem(FILTER_METHOD) as string);
		OptionsManagerEvents.addEventListener(FILTER_METHOD, (event: Event) => this.#setFilterMethod((event as CustomEvent<OptionsManagerEvent<string>>).detail.value));

		this.#setSortField(OptionsManager.getItem(SORT_FIELD) as HeroSortField);
		OptionsManagerEvents.addEventListener(SORT_FIELD, (event: Event) => this.#setSortField((event as CustomEvent<OptionsManagerEvent<string>>).detail.value as HeroSortField));
	}

	#initHTML(): HTMLElement {
		if (this.#htmlElement) {
			return this.#htmlElement;
		}
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
								keyup: (event: InputEvent) => this.#setNameFilter((event.target as HTMLInputElement).value)
							},
						}) as HTMLInputElement,
						this.#htmlSortField = createElement('select', {
							class: 'characters-sort-field',
							childs: [
								createElement('option', { innerText: 'name' }),
								createElement('option', { innerText: 'order' }),
								createElement('option', { innerText: 'female' }),
							],
							value: this.#sortField,
							events: {
								change: (event: Event) => OptionsManager.setItem(SORT_FIELD, (event.target as HTMLSelectElement).value),//this.#setNameFilter(event.target.value)
							},
						}) as HTMLSelectElement,
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
				click: (event: Event) => { if (event.target == event.currentTarget) { this.hide(); } },
			}
		});
		return this.#htmlElement;
	}

	#init(): void {
		const characterTemplates = Dota2HeroTemplates.getTemplates();
		let characterElement;
		for (const [characterId, characterTemplate] of characterTemplates) {
			this.#htmlCharactersContainer!.append(
				characterElement = createCharacterElement(characterTemplate),
			);
			this.#htmlCharacters.set(characterTemplate, characterElement);
			characterElement.addEventListener('click', () => this.#selectCharacter(characterId));
		}
		this.#initialized = true;
		this.#sort();
	}

	#selectCharacter(characterId: string): void {
		Controller.dispatchEvent<CharacterSelected>(ControllerEvent.CharacterSelected, { detail: { characterId: characterId } });
		this.hide();
	}

	get htmlElement(): HTMLElement {
		return this.#htmlElement ?? this.#initHTML();
	}

	show(): void {
		this.#initHTML();
		if (!this.#initialized) {
			this.#init();
		}
		show(this.#htmlElement);
		this.#htmlFilterName!.focus();
		this.#htmlFilterName!.select();
	}

	hide(): void {
		hide(this.#htmlElement);
	}

	#setNameFilter(name: string): void {
		this.#filters.name = name.toLowerCase();
		this.#updateFilters();
		this.#htmlNameContainer!.innerText = name;
		clearTimeout(this.#htmlNameContainerTimeout);
		this.#htmlNameContainerTimeout = setTimeout(() => this.#htmlNameContainer!.innerText = '', 2000);
	}

	#updateFilters(): void {
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

	#matchFilter(characterTemplate: Dota2HeroTemplate): boolean {
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

	#setFilterMethod(filterMethod: string): void {
		if (filterMethod == 'hide') {
			this.#css.textContent = '.character-selector-character.filtered{display: none;}';
		} else {
			this.#css.textContent = '';
		}
	}

	#setSortField(sortField: HeroSortField): void {
		if (this.#htmlSortField) {
			this.#htmlSortField.value = sortField;
		}
		this.#sortField = sortField;
		console.log('sort field: ', sortField)
		this.#sort();
	}

	#sort(): void {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that = this;
		this.#htmlCharacters[Symbol.iterator] = function* (): MapIterator<[Dota2HeroTemplate, HTMLElement]> {
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

		for (const [, htmlCharacter] of this.#htmlCharacters) {
			this.#htmlCharactersContainer!.append(htmlCharacter);
		}
	}
}
