import { OptionsManager } from 'harmony-browser-utils/';
import { createElement, defineHarmonySwitch, HTMLHarmonySwitchElement, show } from 'harmony-ui';
import { Controller } from '../controller';
import { EVENT_EXPORT_OBJ } from '../controllerevents';

export class Export3DPopover {
	#htmlElement?: HTMLElement;
	#html3DExportTexture?: HTMLHarmonySwitchElement;
	#html3DSingleMesh?: HTMLHarmonySwitchElement;
	#html3DSmoothMesh?: HTMLHarmonySwitchElement;
	#html3DMerge?: HTMLHarmonySwitchElement;
	#html3DShowDialog?: HTMLHarmonySwitchElement;

	#initHTML() {
		defineHarmonySwitch();
		this.#htmlElement = createElement('div', {
			class: 'export-3d-popover',
			popover: 'auto',
			hidden: true,
			childs: [
				this.#html3DExportTexture = createElement('harmony-switch', {
					'data-i18n': '#export_textures',
					events: {
						change: (event: Event) => OptionsManager.setItem('app.objexporter.exporttextures', (event.target as HTMLHarmonySwitchElement).state),
					}
				}) as HTMLHarmonySwitchElement,
				this.#html3DSingleMesh = createElement('harmony-switch', {
					'data-i18n': '#single_mesh',
					events: {
						change: (event: Event) => OptionsManager.setItem('app.objexporter.singlemesh', (event.target as HTMLHarmonySwitchElement).state),
					}
				}) as HTMLHarmonySwitchElement,
				this.#html3DSmoothMesh = createElement('harmony-switch', {
					'data-i18n': '#smooth_mesh',
					events: {
						change: (event: Event) => OptionsManager.setItem('app.objexporter.subdivide', (event.target as HTMLHarmonySwitchElement).state),
					}
				}) as HTMLHarmonySwitchElement,
				this.#html3DMerge = createElement('harmony-switch', {
					'data-i18n': '#merge_vertices',
					events: {
						change: (event: Event) => OptionsManager.setItem('app.objexporter.mergevertices', (event.target as HTMLHarmonySwitchElement).state),
					}
				}) as HTMLHarmonySwitchElement,
				this.#html3DShowDialog = createElement('harmony-switch', {
					'data-i18n': '#show_this_dialog',
					events: {
						change: (event: Event) => OptionsManager.setItem('app.objexporter.askoptions', (event.target as HTMLHarmonySwitchElement).state),
					}
				}) as HTMLHarmonySwitchElement,
				createElement('button', {
					i18n: '#export_for_3d_print',
					events: {
						click: () => {
							Controller.dispatchEvent(new CustomEvent(EVENT_EXPORT_OBJ));
							this.#hide();
						},
					}
				}),
				createElement('button', {
					i18n: '#cancel',
					events: {
						click: () => this.#hide(),
					}
				}),

			]
		});
		return this.#htmlElement;
	}

	get htmlElement() {
		return this.#htmlElement ?? this.#initHTML();
	}

	show() {
		if (!this.#html3DExportTexture || !this.#html3DSingleMesh || !this.#html3DSmoothMesh || !this.#html3DShowDialog || !this.#htmlElement) {
			return;
		}
		this.#html3DExportTexture.state = OptionsManager.getItem('app.objexporter.exporttextures');
		this.#html3DSingleMesh.state = OptionsManager.getItem('app.objexporter.singlemesh');
		this.#html3DSmoothMesh.state = OptionsManager.getItem('app.objexporter.subdivide');
		this.#html3DShowDialog.state = OptionsManager.getItem('app.objexporter.askoptions');

		show(this.#htmlElement);
		this.#htmlElement.showPopover();
	}

	#hide() {
		if (this.#htmlElement) {
			this.#htmlElement.hidePopover();
		}
	}
}
