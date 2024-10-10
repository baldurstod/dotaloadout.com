import { closeSVG } from 'harmony-svg';
import { createElement, hide, show, display } from 'harmony-ui';
import { DOTA2_DEFAULT_ECON_URL, DOTA2_ECON_URL } from '../constants';
import { Controller } from '../controller';
import { EVENT_CHARACTER_ITEM_ADDED, EVENT_CHARACTER_PERSONA_CHANGED, EVENT_CLOSE_ITEM_LIST, EVENT_OPEN_CHARACTER_SELECTOR, EVENT_OPEN_ITEM_LIST, EVENT_REMOVE_ITEM, EVENT_SLOT_CLICK } from '../controllerevents';
import { CharacterTemplates } from '../loadout/characters/charactertemplates';
import { getPersonaId } from '../utils/persona';

export class ItemSlots {
	#htmlElement;
	#htmlCharacterIcon;
	#htmlCharacterName;
	#htmlSlotsContainer;
	#htmlSlots = new Map();
	#currentCharacter;

	constructor() {
		Controller.addEventListener(EVENT_CHARACTER_ITEM_ADDED, event => this.#handleItemAdded((event as CustomEvent).detail));
		Controller.addEventListener(EVENT_CHARACTER_PERSONA_CHANGED, event => this.#handlePersonaChanged((event as CustomEvent).detail));

		Controller.addEventListener(EVENT_CLOSE_ITEM_LIST, () => hide(this.#htmlElement));
		Controller.addEventListener(EVENT_OPEN_ITEM_LIST, () => show(this.#htmlElement));
	}

	#initHTML() {
		this.#htmlElement = createElement('div', {
			class: 'item-slots',
			childs: [
				createElement('div', {
					class: 'item-slots-character',
					childs: [
						this.#htmlCharacterIcon = createElement('div', {
							class: 'hero-icon',
							// Hero order id starts at 1
							// we use heroCount - 1 to acknowledge the fact that 0% means top is aligned with top edge and 100% bottom is aligned with bottom edge
							//style: `background-position-y:${(characterTemplate.heroOrderId - 1) / (heroCount - 1) * 100}%`,
						}),
						this.#htmlCharacterName = createElement('div', {
							class: 'hero-name',
							//innerText: characterTemplate.name,
						}),
					],
					events: {
						click: () => Controller.dispatchEvent(new CustomEvent(EVENT_OPEN_CHARACTER_SELECTOR)),
					},
				}),
				this.#htmlSlotsContainer = createElement('div', { class: 'item-slots-list' }),

			],
		});
		return this.#htmlElement;
	}

	get htmlElement() {
		return this.#htmlElement ?? this.#initHTML();
	}

	setCharacter(character) {
		if (!character || character == this.#currentCharacter) {
			return;
		}
		this.#currentCharacter = character;

		this.#htmlSlotsContainer.innerText = '';
		this.#htmlSlots.clear();

		const heroCount = CharacterTemplates.heroCount;

		// Hero order id starts at 1
		// we use heroCount - 1 to acknowledge the fact that 0% means top is aligned with top edge and 100% bottom is aligned with bottom edge
		if (character.isHero()) {
			this.#htmlCharacterIcon.className = 'hero-icon';
			this.#htmlCharacterIcon.style = `background-position-y:${(character.heroOrderId - 1) / (heroCount - 1) * 100}%`;
		} else {
			this.#htmlCharacterIcon.className = `world-slot-${character.id}`;
		}
		this.#htmlCharacterName.innerText = character.name;

		const itemSlots = character.itemSlots;
		if (itemSlots) {
			for (const [_, itemSlot] of itemSlots) {
				const htmlItemSlot = createElement('div', {
					class: 'item-slot',
					parent: this.#htmlSlotsContainer,
					childs: [
						createElement('img', {
							class: 'item-slot-img',
							src: DOTA2_DEFAULT_ECON_URL,
						}),
						createElement('div', {
							class: 'item-name',
							innerText: itemSlot.SlotText,
						}),
						createElement('div', {
							class: 'item-slot-remove',
							innerHTML: closeSVG,
							events: {
								click: (event) => {
									Controller.dispatchEvent(new CustomEvent(EVENT_REMOVE_ITEM, { detail: {
										character: this.#currentCharacter,
										itemID: Number(htmlItemSlot.getAttribute('item-id')),
									} }));
									event.stopPropagation();
								}
								//click: () => console.log(htmlItemSlot.getAttribute('item-id'))//Controller.dispatchEvent(new CustomEvent(EVENT_SLOT_CLICK, { detail: itemSlot.SlotName })),
							},
						}),
					],
					events: {
						click: () => Controller.dispatchEvent(new CustomEvent(EVENT_SLOT_CLICK, { detail: itemSlot.SlotName })),
					},
				});
				if ((itemSlot?.DisplayInLoadout ?? 1) == 0) {
					hide(htmlItemSlot);
				} else {
					this.#htmlSlots.set(itemSlot.SlotName, htmlItemSlot);
				}
			}
		}

		for (const [_, item] of character.getItems()) {
			this.#handleItemAdded(item);
		}
	}

	#handleItemAdded(item) {
		if (item.character == this.#currentCharacter) {
			const itemSlot = item.slot;
			const htmlSlot = this.#htmlSlots.get(itemSlot);
			if (htmlSlot) {
				htmlSlot.setAttribute('item-id', item.id);
				const htmlImg = htmlSlot.getElementsByTagName('img')[0];
				const htmlName = htmlSlot.getElementsByTagName('div')[0];

				const imageInventory = item.imageInventory;
				if (imageInventory) {
					htmlImg.src = DOTA2_ECON_URL + item.imageInventory + '.png';
				} else {
					htmlImg.src = DOTA2_DEFAULT_ECON_URL;
				}
				htmlName.innerText = item.name;
			}
		}
	}

	#handlePersonaChanged(personaId) {
		for (const[name, html] of this.#htmlSlots) {
			if (name == 'persona_selector') {
				// Always display persona selector
				show(html);
			} else {
				display(html, personaId == getPersonaId(name));
			}
		}
	}
}
