import { JSONObject } from 'harmony-types';
import { ItemTemplate } from './itemtemplate';

export class ItemTemplates {
	static #templates = new Map<string, ItemTemplate>();
	static #templatesByName = new Map<string, string>();

	static addTemplate(templateJSON: JSONObject): void {
		this.#templates.set(String(templateJSON.id), new ItemTemplate(templateJSON));
		this.#templatesByName.set(templateJSON.name as string, String(templateJSON.id));
	}

	static getTemplate(id: string) {
		return this.#templates.get(id);
	}

	static getTemplateByName(name: string): string {
		return this.#templatesByName.get(name);
	}

	static getTemplates() {
		return this.#templates;
	}
}
