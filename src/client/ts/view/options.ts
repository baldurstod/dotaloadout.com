import { SceneExplorer, ShaderEditor } from 'harmony-3d';
import { OptionsManager } from 'harmony-browser-utils';
import { createElement, hide, toggle, isVisible, shadowRootStyle, defineHarmonyTab, defineHarmonyTabGroup } from 'harmony-ui';

import { Controller } from '../controller';
import { EVENT_PANEL_OPTIONS_CLOSED, EVENT_PANEL_OPTIONS_OPENED, EVENT_RESET_CAMERA, EVENT_TOOLBAR_OPTIONS } from '../controllerevents';

import optionsCSS from '../../css/options.css';

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

	#initHTML() {
		defineHarmonyTab();
		defineHarmonyTabGroup();
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
