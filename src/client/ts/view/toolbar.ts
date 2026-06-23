import { bugReportSVG, manufacturingSVG, moreHorizSVG, patreonLogoSVG, pauseSVG, photoCameraSVG, playSVG, print3dSVG, settingsSVG, shareSVG, viewInArSVG } from 'harmony-svg';
import { JSONObject } from 'harmony-types';
import { createElement, hide, show } from 'harmony-ui';
import activities from '../../json/activities.json';
import { ENABLE_PATREON_POWERUSER } from '../bundleoptions';
import { Controller, ControllerEvent } from '../controller';

function createButton(svg: string, event: ControllerEvent, i18n: string) {
	return createElement('div', {
		class: 'toolbar-button',
		i18n: { title: i18n, },
		innerHTML: svg,
		events: {
			click: () => Controller.dispatchEvent(event, {}),
		},
	});
}

export class Toolbar {
	#htmlElement?: HTMLElement;
	#htmlPlay?: HTMLElement;
	#htmlPause?: HTMLElement;
	#htmlExportFBXButton?: HTMLElement;
	#htmlExportOBJButton?: HTMLElement;
	#htmlActivitySelector?: HTMLSelectElement;
	#htmlActivityModifiers?: HTMLInputElement;

	constructor() {
		this.#initListeners();
	}

	#initListeners() {
		Controller.addEventListener(ControllerEvent.ToolbarPlay, () => {
			hide(this.#htmlPlay);
			show(this.#htmlPause);

		});
		Controller.addEventListener(ControllerEvent.ToolbarPause, () => {
			show(this.#htmlPlay);
			hide(this.#htmlPause);
		});
	}

	#initHTML() {
		this.#htmlElement = createElement('div', {
			class: 'toolbar',
			childs: [
				createElement('div', {
					class: 'toolbar-items',
					childs: [
						/*createElement('div', {
							innerText: 'characters',
							events: {
								click: () => Controller.dispatchEvent(new CustomEvent('displaycharacters')),
							},
						}),
						createElement('div', {
							innerText: 'weapons',
							events: {
								click: () => Controller.dispatchEvent(new CustomEvent('displayweapons')),
							},
						}),*/
					],
				}),
				createElement('div', {
					class: 'toolbar-activity',
					childs: [
						this.#htmlActivitySelector = createElement('select', {
							class: 'toolbar-activity-selector',
							events: {
								change: (event: InputEvent) => this.#handleActivitySelected((event.target as HTMLSelectElement).value),
							},
						}) as HTMLSelectElement,
						this.#htmlActivityModifiers = createElement('input', {
							class: 'toolbar-activity-modifiers',
							placeholder: 'loadout injured haste aggressive',
							events: {
								change: (event: InputEvent) => this.#handleActivityModifiersChanged((event.target as HTMLSelectElement).value),
								keyup: (event: InputEvent) => this.#handleActivityModifiersChanged((event.target as HTMLSelectElement).value),
							},
						}) as HTMLInputElement,
					],
				}),
				createElement('div', {
					class: 'toolbar-buttons',
					childs: [
						this.#htmlPlay = createButton(playSVG, ControllerEvent.ToolbarPlay, '#play'),
						this.#htmlPause = createButton(pauseSVG, ControllerEvent.ToolbarPause, '#pause'),
						createButton(shareSVG, ControllerEvent.ToolbarShare, '#share_current_loadout'),
						createButton(photoCameraSVG, ControllerEvent.ToolbarPicture, '#save_picture'),
						this.#htmlExportFBXButton = createButton(viewInArSVG, ControllerEvent.ToolbarExportFbx, '#export_fbx'),
						this.#htmlExportOBJButton = createButton(print3dSVG, ControllerEvent.ToolbarExportObj, '#export_for_3d_print'),
						createButton(bugReportSVG, ControllerEvent.ToolbarBug, '#report_bug'),
						createButton(settingsSVG, ControllerEvent.ToolbarOptions, '#options'),
						createButton(manufacturingSVG, ControllerEvent.ToolbarAdvancedOptions, '#advanced_options'),
						createButton(moreHorizSVG, ControllerEvent.ToolbarAbout, '#about'),
						createButton(patreonLogoSVG, ControllerEvent.ToolbarPatreon, '#patreon'),
					]
				}),
			],
		});

		for (const activityName in activities) {
			const activityLabel = (activities as JSONObject)[activityName];
			createElement('option', {
				parent: this.#htmlActivitySelector,
				value: activityName,
				innerText: `${activityLabel}`,
			});
		}

		hide(this.#htmlPlay);
		return this.#htmlElement;
	}

	get htmlElement() {
		return this.#htmlElement ?? this.#initHTML();
	}

	setMode() {
		if (ENABLE_PATREON_POWERUSER) {
			this.#htmlExportOBJButton?.classList.remove('disabled');
			this.#htmlExportFBXButton?.classList.remove('disabled');
		} else {
			this.#htmlExportOBJButton?.classList.add('disabled');
			this.#htmlExportFBXButton?.classList.add('disabled');
		}
	}

	#handleActivitySelected(activity: string) {
		Controller.dispatchEvent(ControllerEvent.ToolbarActivitySelected, { detail: activity });
	}

	#handleActivityModifiersChanged(modifiers: string) {
		Controller.dispatchEvent(ControllerEvent.ToolbarActivityModifiers, { detail: modifiers.split(' ') });
	}

	setActivity(activity: string) {
		if (this.#htmlActivitySelector) {
			this.#htmlActivitySelector.value = activity;
		}
	}

	setModifiers(modifiers: string[]) {
		if (this.#htmlActivityModifiers) {
			this.#htmlActivityModifiers.value = modifiers.join(' ');
		}
	}
}
