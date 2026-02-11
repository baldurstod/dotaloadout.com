import { createElement, display, hide, show } from 'harmony-ui';
import { Controller } from '../controller';
import { EVENT_CHARACTER_PERSONA_CHANGED, EVENT_CLOSE_ITEM_LIST, EVENT_ITEM_CLICK, EVENT_OPEN_ITEM_LIST, EVENT_SLOT_CLICK, SlotClick } from '../controllerevents';
import { Character } from '../loadout/characters/character';
import { ItemManager } from '../loadout/items/itemmanager';
import { ItemTemplate } from '../loadout/items/itemtemplate';
import { ItemTemplates } from '../loadout/items/itemtemplates';
import { getimageinventory } from '../utils/getimageinventory';
import { getPersonaId } from '../utils/persona';

type Filters = {
	name?: string;
	slot?: string;
	rarity?: string;
}

export class ItemList {
	#htmlElement?: HTMLElement;
	#htmlItemsSlotFilter?: HTMLSelectElement;
	#htmlItemsRarityFilter?: HTMLSelectElement;
	#htmlRarityOptions = new Map<string, HTMLOptionElement>();
	#htmlItemsList?: HTMLElement;
	#htmlItems = new Map<ItemTemplate, HTMLElement>();
	#filters: Filters = {};

	constructor() {
		Controller.addEventListener(EVENT_SLOT_CLICK, event => {
			this.#setSlotFilter((event as CustomEvent<SlotClick>).detail);
			if (this.#htmlItemsSlotFilter) {
				this.#htmlItemsSlotFilter.value = (event as CustomEvent<SlotClick>).detail;
			}
		});
		Controller.addEventListener(EVENT_CLOSE_ITEM_LIST, () => hide(this.#htmlElement));
		Controller.addEventListener(EVENT_OPEN_ITEM_LIST, () => show(this.#htmlElement));

		Controller.addEventListener(EVENT_CHARACTER_PERSONA_CHANGED, event => this.#handlePersonaChanged((event as CustomEvent).detail));
	}

	#initHTML() {
		this.#htmlElement = createElement('div', {
			class: 'item-list',
			childs: [
				createElement('div', {
					class: 'item-list-header',
					childs: [
						this.#htmlItemsSlotFilter = createElement('select', {
							class: 'item-list-header-slot-filter',
							events: {
								change: (event: InputEvent) => this.#setSlotFilter((event.target as HTMLSelectElement).value),
								keyup: (event: InputEvent) => this.#setSlotFilter((event.target as HTMLSelectElement).value),
							}
						}) as HTMLSelectElement,
						createElement('input', {
							class: 'item-list-header-slot-filter',
							events: {
								change: (event: InputEvent) => this.#setNameFilter((event.target as HTMLSelectElement).value),
								keyup: (event: InputEvent) => this.#setNameFilter((event.target as HTMLSelectElement).value),
							}
						}),
						this.#htmlItemsRarityFilter = createElement('select', {
							class: 'item-list-header-slot-filter',
							child: createElement('option'),
							events: {
								change: (event: InputEvent) => this.#setRarityFilter((event.target as HTMLSelectElement).value),
								keyup: (event: InputEvent) => this.#setRarityFilter((event.target as HTMLSelectElement).value),
							}
						}) as HTMLSelectElement,
					],
				}),
				createElement('div', {
					class: 'item-list-items',
					child: this.#htmlItemsList = createElement('div', {
						class: 'item-list-items-inner',
					}),
				}),
				/*this.#htmlWeaponList = createElement('div', {
					hidden: true,
					class: 'weaponlist',
					innerText: 'this is the weapons',
				}),*/
			],
		});

		/*Controller.addEventListener('displaycharacters', () => this.#showCharacterList());
		Controller.addEventListener('displayweapons', () => this.#show(this.#htmlWeaponList));
		//Controller.addEventListener('toggleoptions', () => toggle(this.#htmlElement));
		Controller.addEventListener('closeitemlist', () => this.#hide());*/


		return this.#htmlElement;
	}

	/*#show(element) {
		hide(this.#htmlCharacterList);
		hide(this.#htmlWeaponList);
		show(this.#htmlElement);
		show(element);
	}

	async #showCharacterList() {
		this.#show(this.#htmlCharacterList);
		const customPlayers = await Loadout.getCustomPlayers();
		console.log(customPlayers);

		for (const customPlayer of customPlayers) {
			console.log(customPlayer);
			createElement('item-list-item', {
				item: customPlayer,
				//src: new URL(customPlayer.imageInventory + '.png', CS2_ECON_URL),
				//src: customPlayer.imageInventory,
				parent: this.#htmlCharacterList,
				events: {
					click: event => this.selectItem(event.target.item),
				},
			});
		}
	}*/

	#hide() {
		hide(this.#htmlElement);
	}

	get htmlElement() {
		return this.#htmlElement ?? this.#initHTML();
	}

	async setCharacter(character: Character) {
		const itemSlots = character.itemSlots;
		if (itemSlots) {
			this.#htmlItemsSlotFilter!.innerHTML = '<option/><option value="none">Bundle</option>';
			for (const [_, slot] of itemSlots) {
				if ((slot?.DisplayInLoadout ?? '1') == '0') {
					continue;
				}
				createElement('option', { value: slot.SlotName, innerHTML: `${slot.SlotText} (${slot.SlotName})`, parent: this.#htmlItemsSlotFilter });
			}
		}

		//this.#currentCharacter = character;
		this.#htmlItemsList!.innerText = '';
		this.#htmlItems.clear();
		this.#setSlotFilter();
		this.#setRarityFilter();

		const itemIds = await ItemManager.getItems(character.id as string);

		this.#htmlRarityOptions.forEach(html => html.remove());
		this.#htmlRarityOptions.clear();
		for (const itemId of itemIds) {
			const itemTemplate = ItemTemplates.getTemplate(itemId);
			if (itemTemplate) {
				this.#addItem(character, itemTemplate);
			}
		}
	}

	async #addItem(character: Character, itemTemplate: ItemTemplate) {
		const htmlItemSlot = createElement('div', {
			class: `item-list-item item-rarity-${itemTemplate.rarity}`,
			parent: this.#htmlItemsList,
			childs: [
				createElement('img', {
					class: 'item-slot-img',
					src: getimageinventory(itemTemplate),
				}),
				createElement('div', {
					class: 'item-name',
					innerText: itemTemplate.name,
				}),
				createElement('div', {
					class: 'has-styles',
					hidden: !itemTemplate.hasStyles(),
				}),
			],
			events: {
				click: () => Controller.dispatchEvent(new CustomEvent(EVENT_ITEM_CLICK, { detail: { character: character, itemId: itemTemplate.id } })),
			}
		});
		this.#htmlItems.set(itemTemplate, htmlItemSlot);

		this.#addRarity(itemTemplate.rarity);
	}

	#addRarity(rarity: string) {
		if (this.#htmlRarityOptions.has(rarity)) {
			return;
		}
		const htmlRarityOption = createElement('option', {
			parent: this.#htmlItemsRarityFilter,
			innerText: rarity,
		}) as HTMLOptionElement;
		this.#htmlRarityOptions.set(rarity, htmlRarityOption);
	}

	#setSlotFilter(slot?: string) {
		this.#filters.slot = slot;
		this.#updateFilters();
	}

	#setRarityFilter(rarity?: string) {
		this.#filters.rarity = rarity;
		this.#updateFilters();
	}

	#setNameFilter(name?: string) {
		if (name) {
			this.#filters.name = name.toLowerCase().trim();
		} else {
			this.#filters.name = name;
		}
		this.#updateFilters();
	}

	#updateFilters() {
		for (const [itemTemplate, htmlItem] of this.#htmlItems) {
			if (this.#matchFilter(itemTemplate)) {
				show(htmlItem);
			} else {
				hide(htmlItem);
			}
		}
	}

	#matchFilter(itemTemplate: ItemTemplate) {
		const slotFilter = this.#filters.slot;
		if (slotFilter) {
			if (itemTemplate.slot != slotFilter) {
				return false;
			}
		}

		const rarityFilter = this.#filters.rarity;
		if (rarityFilter) {
			if (itemTemplate.rarity != rarityFilter) {
				return false;
			}
		}

		const nameFilter = this.#filters.name;
		if (nameFilter) {
			var itemName = itemTemplate.name;
			if (!itemName.toLowerCase().includes(nameFilter)) {
				return false;
			}
		}
		return true;
	}

	#handlePersonaChanged(personaId: number) {
		if (!this.#htmlItemsSlotFilter) {
			return;
		}
		for (const htmlOption of this.#htmlItemsSlotFilter.options) {
			if (htmlOption.value == 'persona_selector' || htmlOption.value == 'none' || htmlOption.value == '') {
				// Always display persona selector
				show(htmlOption);
			} else {
				display(htmlOption, personaId == getPersonaId(htmlOption.value));
			}
		}
	}
}
