import { I18n } from 'harmony-ui';
import { NotificationManager } from 'harmony-browser-utils/';
import { TF2_GROUP_URL } from '../constants';

export function showAboutLayer() {
	/*let html = `${I18n.getString('#csloadout_service_provided')}<a href="http://steamcommunity.com/id/baldurstod/" target="_blank">Baldurs Tod</a><br>
	<a href="https://www.shapeways.com/shops/baldurstod/" target="_blank">${I18n.getString('#shapeways_shop')}</a><br>
	<a href="https://www.redbubble.com/people/Loadout/shop?asc=u" target="_blank">${I18n.getString('#redbubble_shop')}</a><br>
	${I18n.getString('#model_texture_files_property')}<a href="http://www.valvesoftware.com/" target="_blank">Valve Corporation</a><br>
	${I18n.getString('#valve_tf_trademarks')}`;

	new NotificationManager().addNotification(html, 'info', 15);*/
	new NotificationManager().addNotification(I18n.getString('#loadout_about_content'), 'info', 15);
}

export function showBugNotification() {
	let html = '<a href="' + TF2_GROUP_URL + '" target="_blank" class="i18n" data-i18n="#get_assistance_on_steam"></a><br><a href="https://discord.gg/7EhW2WCWyQ" target="_blank" class="i18n" data-i18n="#get_assistance_on_discord"></a>';
	new NotificationManager().addNotification(html, 'info', 15);
}
