import { createElement, I18n } from 'harmony-ui';
import { addNotification, NotificationType } from 'harmony-browser-utils/';
import { TF2_GROUP_URL } from '../constants';

export function showAboutLayer() {
	/*let html = `${I18n.getString('#csloadout_service_provided')}<a href="http://steamcommunity.com/id/baldurstod/" target="_blank">Baldurs Tod</a><br>
	<a href="https://www.shapeways.com/shops/baldurstod/" target="_blank">${I18n.getString('#shapeways_shop')}</a><br>
	<a href="https://www.redbubble.com/people/Loadout/shop?asc=u" target="_blank">${I18n.getString('#redbubble_shop')}</a><br>
	${I18n.getString('#model_texture_files_property')}<a href="http://www.valvesoftware.com/" target="_blank">Valve Corporation</a><br>
	${I18n.getString('#valve_tf_trademarks')}`;

	addNotification(html, 'info', 15);*/
	addNotification(I18n.getString('#loadout_about_content'), NotificationType.Info, 15);
}

export function showBugNotification() {
	//let html = '<a href="' + TF2_GROUP_URL + '" target="_blank" class="i18n" data-i18n="#get_assistance_on_steam"></a><br><a href="https://discord.gg/7EhW2WCWyQ" target="_blank" class="i18n" data-i18n="#get_assistance_on_discord"></a>';
	const html = createElement('div', {
		childs: [
			createElement('a', {
				style: 'color:white;display:block;',
				href: TF2_GROUP_URL,
				target: '_blank',
				i18n: '#get_assistance_on_steam',
			}),
			createElement('a', {
				style: 'color:white;display:block;',
				href: 'https://discord.gg/7EhW2WCWyQ',//TODO: const
				target: '_blank',
				i18n: '#get_assistance_on_discord',
			}),
		]
	});
	addNotification(html, NotificationType.Info, 15);
}
