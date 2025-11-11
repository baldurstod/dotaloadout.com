import { JSONObject } from 'harmony-utils';
import { CharacterTemplate } from './charactertemplate';

export class CharacterTemplates {
	static #templates = new Map<string, CharacterTemplate>();
	static heroCount = 0;

	static addTemplate(templateJSON: JSONObject/*TODO: improve type*/): void {
		const template = new CharacterTemplate(templateJSON)
		this.#templates.set(templateJSON.ID as string, template);

		if (template.isHero()) {
			++this.heroCount;
		}
	}

	static getTemplate(id: string): CharacterTemplate | undefined {
		return this.#templates.get(id);
	}

	static getTemplates(): Map<string, CharacterTemplate> {
		return this.#templates;
	}
}
