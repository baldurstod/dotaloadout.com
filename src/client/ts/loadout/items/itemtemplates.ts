import { ItemTemplate } from './itemtemplate.js';

export class ItemTemplates {
	static #templates = new Map();
	static #templatesByName = new Map();

	static addTemplate(templateJSON) {
		this.#templates.set(templateJSON.id, new ItemTemplate(templateJSON));
		this.#templatesByName.set(templateJSON.name, templateJSON.id);
	}

	static getTemplate(id) {
		return this.#templates.get(id);
	}

	static getTemplateByName(name) {
		return this.#templatesByName.get(name);
	}

	static getTemplates() {
		return this.#templates;
	}
}
