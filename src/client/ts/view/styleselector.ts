import { createElement } from 'harmony-ui';
import { CharacterSelected, Controller, ControllerEvent } from '../controller';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { Item } from '../loadout/items/item';

export class StyleSelector {
	#htmlElement?: HTMLElement;
	#items = new Map<Item, HTMLElement>();

	constructor() {
		Controller.addEventListener(ControllerEvent.CharacterItemAdded, event => this.#addItem((event as CustomEvent<Item>).detail));
		Controller.addEventListener(ControllerEvent.CharacterItemRemoved, event => this.#removeItem((event as CustomEvent<Item>).detail));
		Controller.addEventListener(ControllerEvent.CharacterSelected, event => this.#handleCharacterSelected((event as CustomEvent<CharacterSelected>).detail.characterId));
	}

	#addItem(item: Item): void {
		if (item.hasStyles()) {
			this.#items.set(item, this.#createItemSelector(item));
		}
	}

	#removeItem(item: Item): void {
		const html = this.#items.get(item);
		if (html) {
			html.remove();
			this.#items.delete(item);
		}
	}

	#handleCharacterSelected(characterId: string): void {
		const character = CharacterManager.getCharacter(characterId);
		if (!character) {
			return;
		}
		this.#items.forEach(html => html.remove());
		this.#items.clear();

		character.getItems().forEach(item => this.#addItem(item));
	}

	#createItemSelector(item: Item): HTMLElement {
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
		for (const [styleId] of item.getStyles()) {
			createElement('div', {
				class: 'style-selector-item-style',
				parent: htmlItemStyles,
				innerText: item.getStyle(Number(styleId)).name as string,
				events: {
					click: () => item.setStyle(Number(styleId)),
				},
			});
		}
		return htmlSelector;
	}

	#initHTML(): HTMLElement {
		this.#htmlElement = createElement('div', {
			class: 'style-selector',
		});
		return this.#htmlElement;
	}

	get htmlElement(): HTMLElement {
		return this.#htmlElement ?? this.#initHTML();
	}
}
