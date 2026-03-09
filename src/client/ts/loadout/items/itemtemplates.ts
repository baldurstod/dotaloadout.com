import { JSONObject } from 'harmony-types';
import { ItemTemplate } from './itemtemplate';

export class ItemTemplates {
	static #templates = new Map<number, ItemTemplate>();
	static #templatesByName = new Map<string, number>();

	static addTemplate(templateJSON: JSONObject): void {
		this.#templates.set(templateJSON.id as number, new ItemTemplate(templateJSON));
		this.#templatesByName.set(templateJSON.name as string, templateJSON.id as number);
	}

	static getTemplate(id: number) {
		return this.#templates.get(id);
	}

	static getTemplateByName(name: string) {
		return this.#templatesByName.get(name);
	}

	static getTemplates() {
		return this.#templates;
	}
}
