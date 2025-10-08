import { vec3 } from 'gl-matrix';
import { Entity, Source2ModelInstance, Source2ModelManager, Source2ParticleManager } from 'harmony-3d';
import { OptionsManager } from 'harmony-browser-utils';
import { getPersonaId } from '../../utils/persona';
import { AssetModifier } from '../assetmodifier';
import { Character } from '../characters/character';
import { MODIFIER_ADDITIONAL_WEARABLE, MODIFIER_ENTITY_CLIENTSIDE_MODEL, MODIFIER_ENTITY_MODEL, MODIFIER_PARTICLE_CREATE } from '../modifiers';
import { ItemTemplate } from './itemtemplate';

export class Item {
	#template: ItemTemplate;
	#character: Character;
	#model: Source2ModelInstance | null;
	#childEntities = new Set<Entity>();
	#extraEntities = new Set<Entity>();
	#visible;
	#alternateModelName;
	#style = 0;
	#characterSkin;
	#arcanaLevel?: number;

	constructor(template: ItemTemplate, character: Character) {
		this.#template = template;
		this.#character = character;
	}

	async getModel(): Promise<Source2ModelInstance | null> {
		if (this.#model) {
			return this.#model;
		}
		const modelName = this.modelName;
		if (!modelName) {
			return;
		}
		this.#model = await Source2ModelManager.createInstance('dota2', this.modelName, true);

		if (this.#model) {
			this.#model.visible = this.#visible;
			this.#model.playSequence('ACT_DOTA_IDLE');
			this.#model.skin = this.skin;
		}
		//loadoutScene.addChild(this.#model);
		return this.#model;
	}

	async playSequence(sequenceName: string) {
		for (const entity of this.getExtraEntities()) {
			(entity as Source2ModelInstance)?.playSequence?.(sequenceName);
		}
		const model = await this.getModel();
		if (!model) {
			return;
		}

		model.playSequence?.(sequenceName);
	}

	getExtraEntities() {
		return this.#extraEntities;
	}

	async remove() {
		this.#model?.remove();
		this.#clearExtraEntities();
	}

	async setVisible(visible) {
		if (visible == true) {
			visible = undefined
		}
		this.#visible = visible;

		const model = await this.getModel();
		if (model) {
			model.visible = visible;
		}

		for (const extraEntity of this.#extraEntities) {
			extraEntity.visible = visible;
		}
	}

	get character() {
		return this.#character;
	}

	get name() {
		return this.#template.name;
	}

	get id() {
		return this.#template.id;
	}

	get imageInventory() {
		return this.#template.imageInventory;
	}

	get slot() {
		return this.#template.slot;
	}

	get modelName() {
		return this.#alternateModelName ?? this.#template.getModelName(this.#style);
	}

	get assetModifiers() {
		return this.#template.assetModifiers;
	}

	get skin() {
		return this.#template.getSkin(this.#style) ?? this.#characterSkin ?? 0;
	}

	set style(style) {
		this.#style = style;
	}

	get style() {
		return this.#style;
	}

	setStyle(styleId) {
		this.#style = styleId;

		//TODO: put that in the caller
		this.#character.processModifiers();
	}

	hasStyles() {
		return this.#template.hasStyles();
	}

	getStyle(styleId) {
		return this.#template.getStyle(styleId);
	}

	getStyles() {
		return this.#template.getStyles();
	}

	getPersonaId() {
		return getPersonaId(this.#template.slot)
	}

	getAssetModifiers() {
		const modifiers = this.assetModifiers;
		if (!modifiers) {
			return;
		}

		const ret = [];
		for (const modifierJSON of modifiers) {
			if (modifierJSON.style === undefined || modifierJSON.style == this.#style) {
				ret.push(new AssetModifier(this, modifierJSON));
			}
		}
		return ret;
	}

	#clearExtraEntities() {
		for (const extraEntity of this.#extraEntities) {
			extraEntity.remove();
		}
		for (const childEntity of this.#childEntities) {
			childEntity.remove();
		}
		this.#childEntities.clear();
		this.#extraEntities.clear();
	}

	async processModifiers(replacements, characterModelId: number) {
		this.#clearExtraEntities();

		const modifiers = this.getAssetModifiers();
		let originalModelName = this.#template.getModelName(this.#style, characterModelId);
		if (!originalModelName && modifiers) {
			for (const modifier of modifiers) {
				if (modifier.type == MODIFIER_ENTITY_MODEL && modifier.asset.endsWith(`_variant_${characterModelId}`)) {
					originalModelName = modifier.modifier;
					break;
				}
			}
		}

		await this.#setItemModel(replacements.get(originalModelName) ?? originalModelName);

		const model = await this.getModel();
		if (model) {
			this.#model.skin = this.skin;
			this.#model.setAttribute('desaturate', new OptionsManager().getItem('app.items.desaturate'));

			this.#model.setBodyGroup('arcana', this.#arcanaLevel ?? 0);
		}

		if (!modifiers) {
			return;
		}

		let position;
		for (const modifier of modifiers) {
			switch (modifier.type) {
				case MODIFIER_PARTICLE_CREATE:
					if (!new OptionsManager().getItem('app.showeffects')) {
						break;
					}
					const systemName = replacements.get(modifier.modifier) ?? modifier.modifier;
					let system = await Source2ParticleManager.getSystem('dota2', systemName/*, snapshotModifiers TODO */);
					system.start();
					if (this.modelName) {
						this.#model?.addChild(system);
						this.#childEntities.add(system);
					} else {
						this.#extraEntities.add(system);
						system.visible = this.#visible;
					}

					break;
				case MODIFIER_ADDITIONAL_WEARABLE:
					const modelName = replacements.get(modifier.asset) ?? modifier.asset;
					const model = await Source2ModelManager.createInstance('dota2', modelName, true);
					if (model) {
						model.visible = this.#visible;
						model.skin = modifier.skin ?? 0;
						this.#extraEntities.add(model);
					}
					break;
				case MODIFIER_ENTITY_MODEL:
					break;
					if (modifier.asset == this.#character.id) {
						break;
					}
					const entityModelName = replacements.get(modifier.modifier) ?? modifier.modifier;
					const entityModel = await Source2ModelManager.createInstance('dota2', entityModelName, true);
					if (entityModel) {
						entityModel.visible = this.#visible;
						entityModel.skin = modifier.skin ?? this.skin ?? 0;
						this.#extraEntities.add(entityModel);
					}
					break;
				case MODIFIER_ENTITY_CLIENTSIDE_MODEL:
					position = vec3.create();

					if (modifier.asset.endsWith('_melee')) {
						position[1] -= 400;
					}
					if (modifier.asset.endsWith('_melee_upgraded')) {
						position[1] -= 300;
					}
					if (modifier.asset.endsWith('_melee_upgraded_mega')) {
						position[1] -= 200;
					}
					if (modifier.asset.endsWith('_ranged')) {
						position[1] -= 100;
					}
					if (modifier.asset.endsWith('_ranged_upgraded')) {
						position[1] += 0;
					}
					if (modifier.asset.endsWith('_ranged_upgraded_mega')) {
						position[1] += 100;
					}
					if (modifier.asset.endsWith('_flagbearer')) {
						position[1] += 200;
					}
					if (modifier.asset.endsWith('_flagbearer_upgraded')) {
						position[1] += 300;
					}
					if (modifier.asset.endsWith('_flagbearer_upgraded_mega')) {
						position[1] += 400;
					}

					// Only keep one tower
					if (
						(modifier.asset.startsWith('npc_dota_goodguys_tower') || modifier.asset.startsWith('npc_dota_badguys_tower'))
						&& !modifier.asset.endsWith('_tower1_mid')) {
						break;
					}

					// Remove bogus towers
					if (modifier.asset.startsWith('dota_goodguys_tower') || modifier.asset.startsWith('dota_badguys_tower')) {
						break;
					}


					const clientsideModelName = replacements.get(modifier.modifier) ?? modifier.modifier;
					const clientsideModel = await Source2ModelManager.createInstance('dota2', clientsideModelName, true);
					if (clientsideModel) {
						clientsideModel.visible = this.#visible;
						clientsideModel.skin = modifier.skin ?? this.skin ?? 0;
						this.#extraEntities.add(clientsideModel);
						clientsideModel.position = position;
					}
					break;
					break;
				default:
					console.warn('item_unknown_modifier_type', modifier.type);
					break;
			}
		}
	}

	reparentChilds() {
		for (let child of this.#childEntities) {
			this.#model?.removeChild(child);
			this.#model?.addChild(child);
		}
	}

	async #setItemModel(modelName) {
		if (this.#alternateModelName != modelName) {
			this.#alternateModelName = modelName;
			await this.#resetModel();
		}
	}

	setCharacterSkin(skin) {
		if (!this.#template.isBaseItem) {
			this.#characterSkin = skin;
		}
	}

	setArcanaLevel(arcanaLevel: number | undefined) {
		this.#arcanaLevel = arcanaLevel;
	}

	async #resetModel() {
		const oldModel = await this.getModel();
		if (oldModel) {
			oldModel.remove();
		}
		this.#model = null;
		//this.#modelPromise = null;

		const model = await this.getModel();
	}
}
