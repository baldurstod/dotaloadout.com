import { bugReportSVG, manufacturingSVG, moreHorizSVG, patreonLogoSVG, pauseSVG, photoCameraSVG, playSVG, print3dSVG, settingsSVG, shareSVG, viewInArSVG } from 'harmony-svg';
import { createElement, hide, show } from 'harmony-ui';
import { JSONObject } from 'harmony-utils';
import activities from '../../json/activities.json';
import { ENABLE_PATREON_POWERUSER } from '../bundleoptions';
import { Controller } from '../controller';
import { EVENT_TOOLBAR_ABOUT, EVENT_TOOLBAR_ACTIVITY_MODIFIERS, EVENT_TOOLBAR_ACTIVITY_SELECTED, EVENT_TOOLBAR_ADVANCED_OPTIONS, EVENT_TOOLBAR_BUG, EVENT_TOOLBAR_EXPORT_FBX, EVENT_TOOLBAR_EXPORT_OBJ, EVENT_TOOLBAR_OPTIONS, EVENT_TOOLBAR_PATREON, EVENT_TOOLBAR_PAUSE, EVENT_TOOLBAR_PICTURE, EVENT_TOOLBAR_PLAY, EVENT_TOOLBAR_SHARE } from '../controllerevents';

function createButton(svg: string, eventName: string, i18n: string) {
	return createElement('div', {
		class: 'toolbar-button',
		i18n: { title: i18n, },
		innerHTML: svg,
		events: {
			click: () => Controller.dispatchEvent(new CustomEvent(eventName)),
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
		Controller.addEventListener(EVENT_TOOLBAR_PLAY, () => {
			hide(this.#htmlPlay);
			show(this.#htmlPause);

		});
		Controller.addEventListener(EVENT_TOOLBAR_PAUSE, () => {
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
						this.#htmlPlay = createButton(playSVG, EVENT_TOOLBAR_PLAY, '#play'),
						this.#htmlPause = createButton(pauseSVG, EVENT_TOOLBAR_PAUSE, '#pause'),
						createButton(shareSVG, EVENT_TOOLBAR_SHARE, '#share_current_loadout'),
						createButton(photoCameraSVG, EVENT_TOOLBAR_PICTURE, '#save_picture'),
						this.#htmlExportFBXButton = createButton(viewInArSVG, EVENT_TOOLBAR_EXPORT_FBX, '#export_fbx'),
						this.#htmlExportOBJButton = createButton(print3dSVG, EVENT_TOOLBAR_EXPORT_OBJ, '#export_for_3d_print'),
						createButton(bugReportSVG, EVENT_TOOLBAR_BUG, '#report_bug'),
						createButton(settingsSVG, EVENT_TOOLBAR_OPTIONS, '#options'),
						createButton(manufacturingSVG, EVENT_TOOLBAR_ADVANCED_OPTIONS, '#advanced_options'),
						createButton(moreHorizSVG, EVENT_TOOLBAR_ABOUT, '#about'),
						createButton(patreonLogoSVG, EVENT_TOOLBAR_PATREON, '#patreon'),
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
		Controller.dispatchEvent(new CustomEvent(EVENT_TOOLBAR_ACTIVITY_SELECTED, { detail: activity }));
	}

	#handleActivityModifiersChanged(modifiers: string) {
		Controller.dispatchEvent(new CustomEvent(EVENT_TOOLBAR_ACTIVITY_MODIFIERS, { detail: modifiers.split(' ') }));
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
