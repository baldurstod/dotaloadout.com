import { createElement } from 'harmony-ui';
import { Controller } from '../controller';
import { EVENT_CHARACTER_ITEM_ADDED, EVENT_CHARACTER_ITEM_REMOVED, EVENT_CHARACTER_SELECTED } from '../controllerevents';
import { CharacterManager } from '../loadout/characters/charactermanager';

export class StyleSelector {
	#htmlElement;
	#items = new Map();

	constructor() {
		Controller.addEventListener(EVENT_CHARACTER_ITEM_ADDED, event => this.#addItem((event as CustomEvent).detail));
		Controller.addEventListener(EVENT_CHARACTER_ITEM_REMOVED, event => this.#removeItem((event as CustomEvent).detail));
		Controller.addEventListener(EVENT_CHARACTER_SELECTED, event => this.#handleCharacterSelected((event as CustomEvent).detail.characterId));

	}

	#addItem(item) {
		if (item.hasStyles()) {
			this.#items.set(item, this.#createItemSelector(item));
		}
	}

	#removeItem(item) {
		const html = this.#items.get(item);
		if (html) {
			html.remove();
			this.#items.delete(item);
		}
	}

	#handleCharacterSelected(characterId) {
		const character = CharacterManager.getCharacter(characterId);
		if (!character) {
			return;
		}
		this.#items.forEach(html => html.remove());
		this.#items.clear();

		character.getItems().forEach(item => this.#addItem(item));
	}

	#createItemSelector(item) {
		let htmlItemStyles;
		const htmlSelector = createElement('div', {
			class: 'style-selector-item',
			parent: this.#htmlElement,
			childs: [
				createElement('div', {
					class: 'style-selector-item-header',
					innerText: item.name,
				}),
				htmlItemStyles = createElement('div', {
					class: 'style-selector-item-style-list',
				}),
			]

		});
		for (const [styleId, style] of item.getStyles()) {
			createElement('div', {
				class: 'style-selector-item-style',
				parent: htmlItemStyles,
				innerText: item.getStyle(styleId).name,
				events: {
					click: () => item.setStyle(styleId),
				},
			});
		}
		return htmlSelector;
	}

	#initHTML() {
		this.#htmlElement = createElement('div', {
			class: 'style-selector',
		});
		return this.#htmlElement;
	}

	get htmlElement() {
		return this.#htmlElement ?? this.#initHTML();
	}
}
