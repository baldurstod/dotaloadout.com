import { JSONObject } from 'harmony-types';
import { ItemTemplate } from './itemtemplate.js';

export class ItemTemplates {
	static #templates = new Map<string, ItemTemplate>();
	static #templatesByName = new Map<string, string>();

	static addTemplate(templateJSON: JSONObject): void {
		this.#templates.set(templateJSON.id as string, new ItemTemplate(templateJSON));
		this.#templatesByName.set(templateJSON.name as string, templateJSON.id as string);
	}

	static getTemplate(id: string) {
		return this.#templates.get(id);
	}

	static getTemplateByName(name: string) {
		return this.#templatesByName.get(name);
	}

	static getTemplates() {
		return this.#templates;
	}
}
