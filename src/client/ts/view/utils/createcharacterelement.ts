import { createElement } from 'harmony-ui';
import { Dota2HeroTemplate, Dota2HeroTemplates } from 'loadout';

export function createCharacterElement(characterTemplate: Dota2HeroTemplate): HTMLElement {
	const heroCount = Dota2HeroTemplates.heroCount;
	return createElement('div', {
		class: 'character-selector-character',
		childs: [
			createElement('div', {
				class: 'icon ' + (characterTemplate.isHero() ? 'hero-icon' : `world-slot-${characterTemplate.id}`),
				// Hero order id starts at 1
				// we use heroCount - 1 to acknowledge the fact that 0% means top is aligned with top edge and 100% bottom is aligned with bottom edge
				...(characterTemplate.isHero()) && { style: `background-position-y:${(characterTemplate.heroOrderId - 1) / (heroCount - 1) * 100}%` },
			}),
			createElement('div', {
				class: 'hero-name',
				innerText: characterTemplate.name,
			}),
		],
	});
}
