import { closeSVG } from 'harmony-svg';
import { createElement, display, hide, show } from 'harmony-ui';
import { Dota2Hero, Dota2HeroTemplates, Dota2Item, Dota2LoadoutController } from 'loadout';
import { DOTA2_DEFAULT_ECON_URL, DOTA2_ECON_URL } from '../constants';
import { Controller, ControllerEvent, PersonaChanged } from '../controller';
import { getPersonaId } from '../utils/persona';

export class ItemSlots {
	#htmlElement?: HTMLElement;
	#htmlCharacterIcon?: HTMLElement;
	#htmlCharacterName?: HTMLElement;
	#htmlSlotsContainer?: HTMLElement;
	#htmlSlots = new Map<string, HTMLElement>();
	#currentCharacter: Dota2Hero | null = null;

	constructor() {
		Dota2LoadoutController.addEventListener('heroitemadded', event => this.#handleItemAdded((event as CustomEvent<Dota2Item>).detail));
		Dota2LoadoutController.addEventListener('heropersonachanged', event => this.#handlePersonaChanged((event as CustomEvent<PersonaChanged>).detail));

		Controller.addEventListener(ControllerEvent.CloseItemList, () => hide(this.#htmlElement));
		Controller.addEventListener(ControllerEvent.OpenItemList, () => show(this.#htmlElement));
	}

	#initHTML(): HTMLElement {
		this.#htmlElement = createElement('div', {
			class: 'item-slots',
			childs: [
				createElement('div', {
					class: 'item-slots-character',
					childs: [
						this.#htmlCharacterIcon = createElement('div', {
							class: 'icon hero-icon',
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
						click: () => Controller.dispatchEvent<void>(ControllerEvent.OpenCharacterSelector),
					},
				}),
				this.#htmlSlotsContainer = createElement('div', { class: 'item-slots-list' }),

			],
		});
		return this.#htmlElement;
	}

	get htmlElement(): HTMLElement {
		return this.#htmlElement ?? this.#initHTML();
	}

	setCharacter(character: Dota2Hero): void {
		if (!character || character == this.#currentCharacter) {
			return;
		}
		this.#currentCharacter = character;

		this.#htmlSlotsContainer!.innerText = '';
		this.#htmlSlots.clear();

		const heroCount = Dota2HeroTemplates.heroCount;

		// Hero order id starts at 1
		// we use heroCount - 1 to acknowledge the fact that 0% means top is aligned with top edge and 100% bottom is aligned with bottom edge
		if (character.isHero()) {
			this.#htmlCharacterIcon!.className = 'icon hero-icon';
			this.#htmlCharacterIcon!.style = `background-position-y:${(character.heroOrderId - 1) / (heroCount - 1) * 100}%`;
		} else {
			this.#htmlCharacterIcon!.className = `icon world-slot-${character.id}`;
		}
		this.#htmlCharacterName!.innerText = character.name;

		const itemSlots = character.itemSlots;
		if (itemSlots) {
			for (const [, itemSlot] of itemSlots) {
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
								click: (event: Event) => {
									Controller.dispatchEvent(ControllerEvent.RemoveItem, {
										detail: {
											character: this.#currentCharacter,
											itemID: htmlItemSlot.getAttribute('item-id'),
										}
									});
									event.stopPropagation();
								}
							},
						}),
					],
					events: {
						click: () => Controller.dispatchEvent(ControllerEvent.SlotClick, { detail: itemSlot.SlotName }),
					},
				});
				if ((itemSlot?.DisplayInLoadout ?? '1') == '0') {
					hide(htmlItemSlot);
				} else {
					this.#htmlSlots.set(itemSlot.SlotName, htmlItemSlot);
				}
			}
		}

		for (const [, item] of character.getItems()) {
			this.#handleItemAdded(item);
		}
	}

	#handleItemAdded(item: Dota2Item): void {
		if (item.character == this.#currentCharacter) {
			const itemSlot = item.slot;
			const htmlSlot = this.#htmlSlots.get(itemSlot);
			if (htmlSlot) {
				htmlSlot.setAttribute('item-id', item.id);
				const htmlImg = htmlSlot.getElementsByTagName('img')[0];
				const htmlName = htmlSlot.getElementsByTagName('div')[0];

				if (htmlImg && htmlName) {
					const imageInventory = item.imageInventory;
					if (imageInventory) {
						htmlImg.src = DOTA2_ECON_URL + (item.imageInventory as string) + '.png';
					} else {
						htmlImg.src = DOTA2_DEFAULT_ECON_URL;
					}
					htmlName.innerText = item.name;
				}
			}
		}
	}

	#handlePersonaChanged(personaId: number): void {
		for (const [name, html] of this.#htmlSlots) {
			if (name == 'persona_selector') {
				// Always display persona selector
				show(html);
			} else {
				display(html, personaId == getPersonaId(name));
			}
		}
	}
}
