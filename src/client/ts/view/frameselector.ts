import { OptionsManager, OptionsManagerEvent, OptionsManagerEvents } from 'harmony-browser-utils';
import { createElement, createShadowRoot, display, I18n } from 'harmony-ui';
import frameSelectorCSS from '../../css/frameselector.css';
import { Controller, ControllerEvent } from '../controller';

export class FrameSelector {
	#shadowRoot?: ShadowRoot;
	#htmlSelector?: HTMLElement;

	#initHTML(): HTMLElement {
		this.#shadowRoot = createShadowRoot('div', {
			adoptStyle: frameSelectorCSS,
			hidden: OptionsManager.getItem('app.panels.frameselector') as boolean,
			childs: [
				this.#htmlSelector = createElement('input', {
					class: 'selector',
					type: 'range',
					min: 0,
					max: 1,
					step: 0.01,
					$input: (event: Event) => {
						Controller.dispatchEvent<number>(ControllerEvent.ChangeAnimFrame, { detail: Number((event.target as HTMLInputElement).value) })
						Controller.dispatchEvent<void>(ControllerEvent.ToolbarPause)
					},
				}),
			]
		});
		I18n.observeElement(this.#shadowRoot);


		OptionsManagerEvents.addEventListener('app.panels.frameselector', (event) => display(this.#shadowRoot, (event as CustomEvent<OptionsManagerEvent<boolean>>).detail.value));

		return this.#shadowRoot.host as HTMLElement;
	}

	get htmlElement(): HTMLElement {
		return this.#shadowRoot?.host as HTMLElement ?? this.#initHTML();
	}
}
