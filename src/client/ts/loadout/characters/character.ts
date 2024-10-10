import { Group, Source2ModelManager, stringToVec3 } from 'harmony-3d';
import { Controller } from '../../controller';
import { EVENT_CHARACTER_ITEM_ADDED, EVENT_CHARACTER_ITEM_REMOVED, EVENT_CHARACTER_PERSONA_CHANGED, EVENT_CHARACTER_UNITS_CHANGED } from '../../controllerevents';
import { Item } from '../items/item';
import { ItemTemplates } from '../items/itemtemplates';
import { CharacterTemplates } from './charactertemplates';
import { Units } from '../misc/units';
import { loadoutScene } from '../scene';
import { MODIFIER_ACTIVITY, MODIFIER_COURIER, MODIFIER_COURIER_FLYING, MODIFIER_ENTITY_MODEL, MODIFIER_HERO_MODEL_CHANGE, MODIFIER_MODEL, MODIFIER_MODEL_SKIN, MODIFIER_PARTICLE, MODIFIER_PERSONA, MODIFIER_PET, MODIFIER_PORTRAIT_BACKGROUND_MODEL } from '../modifiers';
import { DEFAULT_ACTIVITY } from '../../constants';
import { OptionsManager } from 'harmony-browser-utils/src/optionsmanager';
import { AssetModifier } from '../assetmodifier';

const UNIT_PLACEMENT = [
	[0, 0, 0],
	[0, -200, 0],
	[0, 200, 0],
	[0, -400, 0],
	[0, 400, 0],
	[0, -600, 0],
	[0, 600, 0],
]

export class Character {
	#characterId;
	#modelId = 0;
	#template;
	#items = new Map();
	#itemsPerSlot = new Map();
	bundleItem = null;
	//#name = '';
	//#displayName = '';
	#model;
	#modelPromise;
	#visible = false;
	#personaId = 0;// Base hero
	#alternateModelName;
	#activityModifiers = new Set<AssetModifier>();
	#group = new Group({ parent: loadoutScene, quaternion: [0, 0, -1, 1] });// Face -Y
	#pedestalModel;
	#petModel;
	#metamorphosisModel;
	#activity = DEFAULT_ACTIVITY;
	#modifiers = [];
	#units = new Map();
	constructor(characterId) {
		this.#characterId = characterId;
		this.#template = CharacterTemplates.getTemplate(characterId);
		this.#group.name = this.name;
		OptionsManager.addEventListener('app.units.display', event => this.#positionUnits(event));
	}

	async #getModel() {
		if (this.#model) {
			return this.#model;
		}
		if (this.#modelPromise) {
			return this.#modelPromise;
		}
		this.#modelPromise = new Promise(async resolve => {
			this.#model = await Source2ModelManager.createInstance('dota2', this.getModelName(), true);
			this.#group.addChild(this.#model);
			resolve(this.#model);
			await this.playSequence();

		})
		return this.#modelPromise;
	}

	async playSequence() {
		const sequenceName = this.#activity;

		for (const [_, item] of this.#items) {
			for (const entity of item.getExtraEntities()) {
				entity?.playSequence?.(sequenceName);
			}
		}

		for (const [_, entity] of this.#units) {
			entity?.playSequence?.(sequenceName);
		}

		const model = await this.#getModel();
		if (!model) {
			return;
		}
		const modifiers = [];
		//const activityModifier = this.#activityModifiers.get(sequenceName) ?? this.#activityModifiers.get('ALL');
		for (const activityModifier of this.#activityModifiers) {
			if (activityModifier.asset == sequenceName || activityModifier.asset == 'ALL') {
				modifiers.push(activityModifier?.modifier);
			}
		}
		modifiers.push(...this.#modifiers);
		model.playSequence(sequenceName, modifiers);

		model.setAttribute('activity', { activity: sequenceName, modifiers: modifiers })
		this.#petModel?.playSequence(sequenceName);
		this.#metamorphosisModel?.playSequence(sequenceName);
	}

	async setVisible(visible) {
		if (visible == true) {
			visible = undefined
		}
		this.#visible = visible;
		this.#group.visible = visible;
	}

	get name() {
		return this.#template.name;
	}

	get id() {
		return this.#template.id;
	}

	//todo: NameAliases
	get heroOrderId() {
		return this.#template.heroOrderId;
	}

	get itemSlots() {
		return this.#template.itemSlots;
	}

	isHero() {
		return this.#template.isHero();
	}

	getModelName() {
		return this.#alternateModelName ?? this.#template.getModelName(this.#modelId);
	}

	hasItem(itemId) {
		return this.#items.has(itemId);
	}

	async addItem(itemId) {
		if (this.hasItem(itemId)) {
			return;
		}
		const itemTemplate = ItemTemplates.getTemplate(itemId);
		if (!itemTemplate) {
			return;
		}

		const item = new Item(itemTemplate, this);
		if (!item) {
			return;
		}
		item.setVisible(this.#personaId == item.getPersonaId());

		this.#items.set(itemId, item);

		Controller.dispatchEvent(new CustomEvent(EVENT_CHARACTER_ITEM_ADDED, { detail: item }));

		if (item.slot) {
			this.#replaceSlot(item);
		}

		await this.#addChild(await item.getModel());
	}

	async #addChild(itemModel) {
		const model = await this.#getModel();

		if (model) {
			model.addChild(itemModel);
		} else {
			this.#group.addChild(itemModel);
		}

	}

	removeItem(itemId) {
		const item = this.#items.get(itemId);

		Controller.dispatchEvent(new CustomEvent(EVENT_CHARACTER_ITEM_REMOVED, { detail: item }));

		if (!item) {
			return;
		}
		item.remove();
		this.#items.delete(itemId);
		this.#itemsPerSlot.delete(item.slot);
	}

	#replaceSlot(item) {
		const previousItem = this.#itemsPerSlot.get(item.slot);
		if (previousItem) {
			this.removeItem(previousItem.id);
		}

		this.#itemsPerSlot.set(item.slot, item);
	}

	getItems() {
		return new Map(this.#items);
	}

	getItemsWithBundle() {
		const items = this.getItems();
		if (this.bundleItem) {
			items.set(this.bundleItem.id, this.bundleItem);
		}
		return items;
	}

	async getAssetModifiers() {
		let modifiers = [];
		for (const [_, item] of this.#items) {
			const itemModifiers = item.getAssetModifiers();
			if (itemModifiers) {
				modifiers = modifiers.concat(itemModifiers);
			}
		}
		this.setPersonaId(0);
		return modifiers;
	}

	#clearExtraEntities() {
		this.#pedestalModel?.remove();
		this.#petModel?.remove();
		this.#metamorphosisModel?.remove();

		this.#pedestalModel = null;
		this.#petModel = null;
		this.#metamorphosisModel = null;

		for (const [_, entity] of this.#units) {
			entity?.remove();
		}
		this.#units.clear();
		Controller.dispatchEvent(new CustomEvent(EVENT_CHARACTER_UNITS_CHANGED));
	}

	async processModifiers() {
		this.#group.setAttribute('desaturate', OptionsManager.getItem('app.characters.desaturate'));
		this.#clearExtraEntities();
		const modifiers = await this.getAssetModifiers()

		await this.#processGeneratedUnits();

		//this.usePersonaModel(this.#personaId);
		let alternateModelName;
		const replacements = new Map();
		let skin = 0;

		this.#activityModifiers.clear();

		for (const modifier of modifiers) {
			switch (modifier.type) {
				case MODIFIER_PERSONA:
					console.log(modifier);
					this.setPersonaId(Number(modifier.persona));
					break;
				case MODIFIER_ENTITY_MODEL:
				case MODIFIER_COURIER:
				case MODIFIER_COURIER_FLYING:
					if (modifier.asset == this.id) {
						alternateModelName = modifier.modifier;
					} else {
						//console.error('Have a modifier for another entity: ', modifier);
						await this.#setUnit(modifier);
					}
					break;
				case MODIFIER_MODEL:
				case MODIFIER_PARTICLE:
					replacements.set(modifier.asset, modifier.modifier);
					break;
				case MODIFIER_MODEL_SKIN:
					skin = modifier.skin;
					break;
				case MODIFIER_ACTIVITY:
					this.#activityModifiers.add(modifier);
					break;
				case MODIFIER_PET:
				case MODIFIER_PORTRAIT_BACKGROUND_MODEL:
				case MODIFIER_HERO_MODEL_CHANGE:
					const modelName = replacements.get(modifier.asset) ?? modifier.modifier ?? modifier.asset;
					const model = await Source2ModelManager.createInstance('dota2', modelName, true);
					if (model) {
						model.visible = this.#visible;
						model.skin = modifier.skin ?? 0;
						const loadoutDefaultOffset = modifier.loadoutDefaultOffset;
						if (loadoutDefaultOffset) {
							model.position = stringToVec3(loadoutDefaultOffset);
						}
						if (modifier.type == MODIFIER_PET) {
							this.#petModel = model;
						} if (modifier.type == MODIFIER_HERO_MODEL_CHANGE) {
							this.#metamorphosisModel = model;
						} else {
							this.#pedestalModel = model;
						}
					}
					break;
				default:
					console.warn('character_unknown_modifier_type', modifier.type);
					break;
			}
		}

		if (!this.#pedestalModel) {
			await this.#initPedestal();
		}

		await this.#setCharacterModel(alternateModelName);
		const model = await this.#getModel();
		this.#setSkin(skin);

		this.#group.addChild(this.#pedestalModel);
		this.#group.addChild(this.#petModel);
		this.#group.addChild(this.#metamorphosisModel);

		const desaturateItems = OptionsManager.getItem('app.items.desaturate');
		this.#pedestalModel?.setAttribute('desaturate', desaturateItems);
		this.#petModel?.setAttribute('desaturate', desaturateItems);

		if (this.#pedestalModel) {
			if (OptionsManager.getItem('app.showpedestal')) {
				this.#pedestalModel.visible = undefined;
			} else {
				this.#pedestalModel.visible = false;
			}
		}

		if (this.#metamorphosisModel) {
			if (OptionsManager.getItem('app.showmetamorphosis')) {
				this.#metamorphosisModel.visible = undefined;
				this.#model.visible = false;
			} else {
				this.#metamorphosisModel.visible = false;
				this.#model.visible = undefined;
			}
		}

		for (const [_, item] of this.#items) {
			await item.processModifiers(replacements);
			for (const entity of item.getExtraEntities()) {
				await this.#addChild(entity);
			}
		}

		await this.#reparentItems();
		await this.playSequence();
	}

	async #processGeneratedUnits() {
		const itemSlots = this.itemSlots;
		if (itemSlots) {
			for (const [_, itemSlot] of itemSlots) {
				if (itemSlot.GeneratesUnits) {
					for (const i in itemSlot.GeneratesUnits) {
						const unitID = itemSlot.GeneratesUnits[i];
						const model = Units.getModel(unitID);
						if (model) {
							this.#setUnit({ asset: unitID, modifier: model });
						}
					}
				}
			}
		}
	}

	async #setUnit(modifier) {
		let modifierAsset = modifier.asset;
		const modifierType = modifier.type;
		if (modifierType == MODIFIER_COURIER || modifierType == MODIFIER_COURIER_FLYING) {
			modifierAsset += '_' + modifierType;
		}
		const modelName = modifier.modifier;
		const model = await Source2ModelManager.createInstance('dota2', modelName, true);
		if (model) {
			model.visible = this.#visible;
			model.skin = modifier.skin ?? modifier.item?.skin ?? 0;
			const loadoutDefaultOffset = modifier.loadoutDefaultOffset;
			if (loadoutDefaultOffset) {
				model.position = stringToVec3(loadoutDefaultOffset);
			}
			this.#units.get(modifierAsset)?.remove();
			this.#units.delete(modifierAsset);
			model.position = UNIT_PLACEMENT[this.#units.size + (this.getModelName() ? 1 : 0)];
			model.visible = OptionsManager.getSubItem('app.units.display', modifierAsset) ? undefined : false;

			OptionsManager.addEventListener('app.units.display', (event) => {
				model.visible = event.detail.value[modifierAsset] ? undefined : false;
			});

			this.#units.set(modifierAsset, model);
			Controller.dispatchEvent(new CustomEvent(EVENT_CHARACTER_UNITS_CHANGED));

			this.#group.addChild(model);
		}
		await this.#positionUnits();
	}

	async #positionUnits(event?) {
		const display = event?.detail?.value ?? OptionsManager.getItem('app.units.display');
		console.info(display);
		let unit = this.getModelName() ? 1 : 0;
		for (const [unitId, model] of this.#units) {
			console.info(unitId, model);
			if (display[unitId]) {
				model.position = UNIT_PLACEMENT[unit];
				++unit;
			}
		}
	}

	async #initPedestal() {
		this.#pedestalModel = await Source2ModelManager.createInstance('dota2', OptionsManager.getItem('app.loadout.pedestalmodel'), true);
	}

	async #setSkin(skin) {
		const model = await this.#getModel();
		if (!model) {
			return;
		}
		model.skin = skin;
		for (const [_, item] of this.#items) {
			item.setCharacterSkin(skin);
		}
	}

	async #reparentItems() {
		for (const [_, item] of this.#items) {
			await this.#addChild(await item.getModel());
			item.reparentChilds();
		}
	}

	async #setCharacterModel(modelName) {
		if (this.#alternateModelName != modelName) {
			this.#alternateModelName = modelName;
			await this.#resetModel();
		}
	}

	async #resetModel() {
		const oldModel = await this.#getModel();
		if (oldModel) {
			oldModel.remove();
		}
		this.#model = null;
		this.#modelPromise = null;
	}

	setPersonaId(personaId) {
		for (const [_, item] of this.#items) {
			item.setVisible(personaId == item.getPersonaId());
		}
		Controller.dispatchEvent(new CustomEvent(EVENT_CHARACTER_PERSONA_CHANGED, { detail: personaId }));
	}

	async setActivity(activity) {
		this.#activity = activity;
		await this.playSequence();
	}

	getActivity() {
		return this.#activity;
	}

	async setModifiers(modifiers) {
		this.#modifiers = modifiers;
		await this.playSequence();
	}

	getModifiers() {
		return this.#modifiers;
	}

	exportLoadout() {
		if (this.#visible === false) {
			return;
		}

		const items = [];
		for (const [_, item] of this.#items) {
			items.push({
				id: item.id,
				style: item.style
			});
		}

		const json = {
			npc: this.#characterId,
			items: items
		}

		return json;
	}

	async importLoadout(characterJSON) {
		let itemsJSON = characterJSON.items;
		if (itemsJSON) {
			for (let itemJSON of itemsJSON) {
				const itemId = itemJSON.id;
				const item = await this.addItem(itemId);
			}
		}
		//await this.#importLoadoutUnusualEffects(characterJSON.unusualEffects);
	}

	getUnits() {
		return this.#units;
	}
}
