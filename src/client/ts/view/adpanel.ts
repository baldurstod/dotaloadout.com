import { NotificationManager } from 'harmony-browser-utils/src/notificationManager';
import { createElement, I18n } from 'harmony-ui';
import { ADSBYGOOGLE_INS, ADSBYGOOGLE_SRC } from '../googleconstants';

const AD_WIDTH = '300px';

export class AdPanel {
	#htmlElement;
	#htmlAdContent;

	#initHTML() {
		this.#htmlElement = createElement('div', {
			style:`display:flex;flex-direction: column;width:${AD_WIDTH}`,
			childs: [
				createElement('div', {
					class: 'loadout-application-advertisement-header',
					childs: [
						createElement('div', {i18n: '#advertisement'}),
						createElement('div', {i18n: '#how_to_remove'}),
					],
					events: {
						click: () => NotificationManager.addNotification(I18n.getString('#feature_patreon'), 'warning', 10)
					}
				}),
				this.#htmlAdContent = createElement('div', {
					style: 'flex:1',
					//innerHTML: ADSBYGOOGLE_INS,
					child: createElement('script', { src: ADSBYGOOGLE_SRC, async: 1 }),
				}),
			]
		});

		const ad = createElement('div', {
			style: 'width:300px; height:auto;position:absolute;top:10rem;right:0;z-index:500;',
			class: 'application',
			innerHTML: ADSBYGOOGLE_INS,
		});

		Math.random() > 0.5 ? document.body.prepend(ad) : document.body.append(ad);

		return this.#htmlElement;
	}

	get htmlElement() {
		return this.#htmlElement ?? this.#initHTML();
	}
}
