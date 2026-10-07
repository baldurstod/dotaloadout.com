import { Dota2ItemTemplate } from 'loadout';
import { DOTA2_DEFAULT_ECON_URL, DOTA2_ECON_URL } from '../constants';

export function getimageinventory(item: Dota2ItemTemplate) {
	let imageInventory = item.imageInventory;
	if (imageInventory) {
		return DOTA2_ECON_URL + imageInventory + '.png';
	} else {
		return DOTA2_DEFAULT_ECON_URL;
	}
}
