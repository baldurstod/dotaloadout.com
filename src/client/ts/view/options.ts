import { Entity, ManifestRepository, MergeRepository, Repositories, Repository, RepositoryEntry, SceneExplorer, ShaderEditor, Source2ModelManager, VpkRepository, ZipRepository } from 'harmony-3d';
import { OptionsManager } from 'harmony-browser-utils';
import { createElement, hide, toggle, isVisible, shadowRootStyle, defineHarmonyTab, defineHarmonyTabGroup, HTMLHarmonySwitchElement, HTMLHarmonyFileInputElement, HTMLHarmonyTabElement, I18n, defineHarmonyFileInput } from 'harmony-ui';
import { Controller } from '../controller';
import { EVENT_PANEL_OPTIONS_CLOSED, EVENT_PANEL_OPTIONS_OPENED, EVENT_RESET_CAMERA, EVENT_TOOLBAR_OPTIONS } from '../controllerevents';
import { defineRepository, HTMLRepositoryElement } from 'harmony-3d-utils';
import optionsCSS from '../../css/options.css';
import repositoryEntryCSS from '../../css/repositoryentry.css';
import { loadoutScene } from '../loadout/scene';

export class Options {
	#htmlElement;
	#htmlFreeRotation;
	#htmlOrthoCam;
	#htmlHideItemsName;
	#htmlShowPedestal;
	#htmlShowMetamorphosis;
	#htmlShowPrices;
	#htmlShowEffects;
	#htmlCurrency;
	#shaderEditor = new ShaderEditor();
	#htmlTabImport?: HTMLHarmonyTabElement;

	#initHTML() {
		defineHarmonyTab();
		defineHarmonyTabGroup();
		defineHarmonyFileInput();

		let htmlOverrideGameModels: HTMLHarmonySwitchElement;
		this.#htmlElement = createElement('div', {
			hidden: true,
			class: 'options',
			child: createElement('harmony-tab-group', {
				childs: [
					createElement('harmony-tab', {
						'data-i18n': '#general_options',
						childs: [
							createElement('group', {
								class: 'camera-options',
								childs: [
									this.#htmlFreeRotation = createElement('harmony-switch', {
										class: 'large',
										'data-i18n': '#free_rotation',
										events: {
											change: event => new OptionsManager().setItem('app.cameras.orbit.polarrotation', event.target.state)
										}
									}),
									this.#htmlOrthoCam = createElement('harmony-switch', {
										class: 'large',
										'data-i18n': '#orthographic_camera',
										events: {
											change: event => new OptionsManager().setItem('app.cameras.default.orthographic', event.target.state)
										}
									}),
									createElement('div', {
										class: 'option-button',
										i18n: '#reset_camera',
										events: {
											click: () => Controller.dispatchEvent(new CustomEvent(EVENT_RESET_CAMERA)),
										}
									}),
								],
							}),
							createElement('group', {
								class: 'items-options',
								childs: [
									this.#htmlHideItemsName = createElement('harmony-switch', {
										class: 'large',
										'data-i18n': '#hideitemname',
										events: {
											change: event => new OptionsManager().setItem('app.itemselector.hideitemname', event.target.state)
										}
									}),
									this.#htmlShowPedestal = createElement('harmony-switch', {
										class: 'large',
										'data-i18n': '#show_pedestal',
										events: {
											change: event => new OptionsManager().setItem('app.showpedestal', event.target.state)
										}
									}),
									this.#htmlShowMetamorphosis = createElement('harmony-switch', {
										class: 'large',
										'data-i18n': '#show_metamorphosis',
										events: {
											change: event => new OptionsManager().setItem('app.showmetamorphosis', event.target.state)
										}
									}),
									this.#htmlShowPrices = createElement('harmony-switch', {
										class: 'large',
										'data-i18n': '#get_market_prices',
										events: {
											change: event => new OptionsManager().setItem('app.market.automarket', event.target.state)
										}
									}),
									this.#htmlCurrency = createElement('select', {
										class: 'options-currencies',
										events: {
											change: event => new OptionsManager().setItem('app.market.currency', event.target.value)
										}
									}),
									this.#htmlShowEffects = createElement('harmony-switch', {
										class: 'large',
										'data-i18n': '#show_effects',
										events: {
											change: event => new OptionsManager().setItem('app.showeffects', event.target.state)
										}
									}),
								],
							}),
						]
					}),
					createElement('harmony-tab', {
						'data-i18n': '#scene_explorer',
						child: new SceneExplorer().htmlElement,
					}),
					createElement('harmony-tab', {
						'data-i18n': '#shader_editor',
						events: {
							activated: event => {
								this.#shaderEditor.initEditor({ aceUrl: './assets/js/ace-builds/src-min/ace.js', displayCustomShaderButtons: true });
								event.target.append(this.#shaderEditor);
							},
						},
					}),
					this.#htmlTabImport = createElement('harmony-tab', {
						'data-i18n': '#import_files',
						childs: [
							createElement('group', {
								class: 'misc',
								i18n: {
									title: '#import_models_locally',
								},
								childs: [
									createElement('harmony-file-input', {
										'data-i18n': '#import_models_locally',
										'data-accept': '.zip,.vpk',
										'data-tooltip-i18n': '#import_models_zip_tooltip',
										events: {
											change: (event: Event) => this.#importModels((event.target as HTMLHarmonyFileInputElement).files, htmlOverrideGameModels.state as boolean),
										},
									}),
									htmlOverrideGameModels = createElement('harmony-switch', {
										'data-i18n': '#override_game_models',
										events: {
											change: (event: Event) => new OptionsManager().setItem('app.repositories.import.overridemodels', htmlOverrideGameModels.state),
										},
									}) as HTMLHarmonySwitchElement,
								],
							}),
						]
					}) as HTMLHarmonyTabElement,
				],
				adoptStyle: optionsCSS,
			}),
		});

		new OptionsManager().getList('app.market.currency').then(currencyList => {
			if (currencyList) {
				this.#htmlCurrency.innerText = '';
				for (let currency of currencyList) {
					createElement('option', {
						parent: this.#htmlCurrency,
						innerText: currency,
					})
				}
				this.#htmlCurrency.value = new OptionsManager().getItem('app.market.currency');
			}
		});

		Controller.addEventListener('closeoptions', () => hide(this.#htmlElement));
		Controller.addEventListener(EVENT_TOOLBAR_OPTIONS, () => this.#toggle());

		new OptionsManager().addEventListener('app.cameras.orbit.polarrotation', (event: CustomEvent) => this.#htmlFreeRotation.state = event.detail.value);
		new OptionsManager().addEventListener('app.cameras.default.orthographic', (event: CustomEvent) => this.#htmlOrthoCam.state = event.detail.value);
		new OptionsManager().addEventListener('app.itemselector.hideitemname', (event: CustomEvent) => this.#htmlHideItemsName.state = event.detail.value);
		new OptionsManager().addEventListener('app.showpedestal', (event: CustomEvent) => this.#htmlShowPedestal.state = event.detail.value);
		new OptionsManager().addEventListener('app.showmetamorphosis', (event: CustomEvent) => this.#htmlShowMetamorphosis.state = event.detail.value);
		new OptionsManager().addEventListener('app.market.automarket', (event: CustomEvent) => this.#htmlShowPrices.state = event.detail.value);
		new OptionsManager().addEventListener('app.showeffects', (event: CustomEvent) => this.#htmlShowEffects.state = event.detail.value);
		new OptionsManager().addEventListener('app.market.currency', (event: CustomEvent) => this.#htmlCurrency.value = event.detail.value);

		return this.#htmlElement;
	}

	async #importModels(files: FileList | null, overrideModels: boolean) {
		if (!files) {
			return;
		}
		for (const file of files) {
			await this.#importModels2(file, overrideModels);
		}
	}

	async #importModels2(file: File, overrideModels: boolean) {
		//TODO: check zip
		const dota2Repository = Repositories.getRepository('dota2') as MergeRepository;
		let localRepo: Repository;

		if (file.name.endsWith('.zip')) {
			localRepo = new ZipRepository(file.name, file);
		} else if (file.name.endsWith('.vpk')) {
			localRepo = new VpkRepository(file.name, [file]);
		} else {
			return;
		}

		if (overrideModels) {
			//TODO:add message
			dota2Repository.unshiftRepository(localRepo);
		} else {
			const repo = new ManifestRepository(new MergeRepository(file.name, localRepo, dota2Repository));
			Repositories.addRepository(repo);
			await repo.generateModelManifest();
			this.#addRepo(repo);
			Source2ModelManager.loadManifest(file.name);
		}
	}

	async #addRepo(repo: Repository) {
		const root = await repo.getFileList();
		if (!root) {
			return;
		}

		defineRepository();

		const repositoryView = createElement('harmony3d-repository', {
			parent: this.#htmlTabImport,
			adoptStyle: repositoryEntryCSS,
			events: {
				fileclick: (event: CustomEvent) => console.info((event as CustomEvent).detail.getFullName()),
				directoryclick: (event: CustomEvent) => console.info((event as CustomEvent).detail.getFullName(), event),
				entrycreated: (event: CustomEvent) => {
					createElement('div', {
						class: 'custom-buttons',
						parent: (event as CustomEvent).detail.view,
						slot: 'custom',
						childs: [
							createElement('button', {
								i18n: '#add_to_scene',
								events: {
									click: () => this.#addModel((event as CustomEvent).detail.entry),
								}
							}),
							/*
							createElement('button', {
								i18n: '#add_to_current_character',
								events: {
									click: () => this.#addModel((event as CustomEvent).detail.entry, CharacterManager.getCurrentCharacter()?.characterModel),
								}
							}),
							*/
						]
					});
					I18n.observeElement((event as CustomEvent).detail.view);
				},
			}
		}) as HTMLRepositoryElement;
		repositoryView.setFilter({ extension: 'vmdl_c', directories: false });
		repositoryView.setRepository(repo);
		//repositoryView.addStyle(repositoryEntryCSS);
	}

	async #addModel(entry: RepositoryEntry, parent?: Entity | null) {
		const model = await Source2ModelManager.createInstance(entry.getRepository().name, entry.getFullName(), true);//await ModelManager.addTF2Model(entry.getFullName(), entry.getRepository().name);

		if (model) {
			(parent ?? loadoutScene).addChild(model);
		}
	}

	#toggle() {
		toggle(this.#htmlElement);

		let event;
		if (isVisible(this.#htmlElement)) {
			event = EVENT_PANEL_OPTIONS_OPENED;
		} else {
			event = EVENT_PANEL_OPTIONS_CLOSED;
		}
		Controller.dispatchEvent(new CustomEvent(event));
	}

	get htmlElement() {
		return this.#htmlElement ?? this.#initHTML();
	}
}
