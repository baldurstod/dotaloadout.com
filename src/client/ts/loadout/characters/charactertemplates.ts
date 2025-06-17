import { CharacterTemplate } from './charactertemplate';

export class CharacterTemplates {
	static #templates = new Map<string, CharacterTemplate>();
	static heroCount = 0;

	static addTemplate(templateJSON) {
		const template = new CharacterTemplate(templateJSON)
		this.#templates.set(templateJSON.ID, template);

		if (template.isHero()) {
			++this.heroCount;
		}
	}

	static getTemplate(id) {
		return this.#templates.get(id);
	}

	static getTemplates() {
		return this.#templates;
	}
}
