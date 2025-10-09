import { AmbientLight, CameraProjection, Graphics, Group, MergeRepository, ObjExporter, PointLight, Repositories, Source2ModelManager, Source2ParticleManager, WebRepository, exportToBinaryFBX, stringToVec3 } from 'harmony-3d';
import { NotificationType, OptionsManager, OptionsManagerEvents, ShortcutHandler, addNotification, saveFile } from 'harmony-browser-utils';
import { I18n, createElement, createShadowRoot, documentStyle, hide, shadowRootStyle, show } from 'harmony-ui';
import applicationCSS from '../css/application.css';
import characterSelectorCSS from '../css/characterselector.css';
import export3dPopoverCSS from '../css/export3dpopover.css';
import htmlCSS from '../css/html.css';
import itemListCSS from '../css/itemlist.css';
import itemListItemCSS from '../css/itemlistitem.css';
import itemSlotsCSS from '../css/itemslots.css';
import loadoutCSS from '../css/loadout.css';
import marketPricesCSS from '../css/marketprices.css';
import statusbarCSS from '../css/statusbar.css';
import styleSelectorCSS from '../css/styleselector.css';
import toolbarCSS from '../css/toolbar.css';
import varsCSS from '../css/vars.css';
import viewerCSS from '../css/viewer.css';
import { DOTA2_REPOSITORY, SHARE_LOADOUT_URL } from './constants';
import { Controller } from './controller';
import { EVENT_CHARACTERS_LOADED, EVENT_CHARACTER_SELECTED, EVENT_CLOSE_ITEM_LIST, EVENT_EXPORT_OBJ, EVENT_OPEN_CHARACTER_SELECTOR, EVENT_OPEN_ITEM_LIST, EVENT_PANEL_OPTIONS_CLOSED, EVENT_PANEL_OPTIONS_OPENED, EVENT_RESET_CAMERA, EVENT_TOOLBAR_ABOUT, EVENT_TOOLBAR_ADVANCED_OPTIONS, EVENT_TOOLBAR_BUG, EVENT_TOOLBAR_EXPORT_FBX, EVENT_TOOLBAR_EXPORT_OBJ, EVENT_TOOLBAR_PATREON, EVENT_TOOLBAR_PAUSE, EVENT_TOOLBAR_PICTURE, EVENT_TOOLBAR_PLAY, EVENT_TOOLBAR_SHARE } from './controllerevents';
import { CharacterManager } from './loadout/characters/charactermanager';
import { MarketPrice } from './loadout/marketprice';
import { loadoutCamera, loadoutColorBackground, loadoutScene } from './loadout/scene';
import { showAboutLayer, showBugNotification } from './misc/about';
import { hexToRgb } from './utils/hextorgb';
import { AdPanel } from './view/adpanel';
import { CharacterSelector } from './view/characterselector';
import { ItemList } from './view/itemlist';
import { ItemSlots } from './view/itemslots';
import { MarketPrices } from './view/marketprices';
import { Options } from './view/options';
import { StyleSelector } from './view/styleselector';
import { Toolbar } from './view/toolbar';
import { Viewer } from './view/viewer';

documentStyle(htmlCSS);
documentStyle(varsCSS);
/*documentStyle(applicationCSS);
documentStyle(loadoutCSS);
documentStyle(characterSelectorCSS);
documentStyle(export3dPopoverCSS);
documentStyle(viewerCSS);
documentStyle(toolbarCSS);
documentStyle(styleSelectorCSS);
documentStyle(statusbarCSS);
documentStyle(optionsCSS);
documentStyle(marketPricesCSS);
documentStyle(itemSlotsCSS);
documentStyle(itemListItemCSS);
documentStyle(itemListCSS);*/

import { setTimeoutPromise } from 'harmony-utils';
import english from '../json/i18n/english.json';
import french from '../json/i18n/french.json';
import optionsmanager from '../json/optionsmanager.json';
import { ENABLE_PATREON_BASE, ENABLE_PATREON_POWERUSER, PATREON_IS_LOGGED, PRODUCTION } from './bundleoptions';
import { GOOGLE_ANALYTICS_ID } from './googleconstants';
import { Export3DPopover } from './view/export3dpopover';
import { UnitSelector } from './view/unitselector';

class Application {
	#appAdPanel = new AdPanel();
	#appCharacterSelector = new CharacterSelector();
	#appExport3DPopover = ENABLE_PATREON_POWERUSER ? new Export3DPopover() : null;
	#appItemList = new ItemList();
	#appItemSlots = new ItemSlots();
	#appMarketPrices = new MarketPrices();
	#appOptions = new Options();
	//#appStatusbar = new Statusbar();
	#appStyleSelector = new StyleSelector();
	#appUnitSelector = new UnitSelector();
	#appToolbar = new Toolbar();
	#appViewer = new Viewer();
	//#htmlElement;
	#lightsContainer;
	#ambientLight;
	#pointLights;
	#shadowRoot?: ShadowRoot;
	constructor() {
		I18n.setOptions({ translations: [english, french] });
		I18n.start();
		this.#initListeners();
		this.#initHTML();
		this.#iniRepositories();
		this.#start();
		this.#initLights();
		this.#initOptions();
		this.#setupAnalytics();
	}

	async #start() {
		await CharacterManager.loadCharacters();
		this.#loadUrlLoadout();
	}

	#initOptions() {
		OptionsManagerEvents.addEventListener('app.lang', event => I18n.setLang((event as CustomEvent).detail.value));
		OptionsManagerEvents.addEventListener('app.backgroundcolor', event => this.backGroundColor = (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('app.cameras.orbit.position', event => loadoutCamera.position = stringToVec3((event as CustomEvent).detail.value));
		OptionsManagerEvents.addEventListener('app.cameras.orbit.target', event => this.#appViewer.setCameraTarget(stringToVec3((event as CustomEvent).detail.value)));
		OptionsManagerEvents.addEventListener('app.cameras.orbit.verticalfov', event => loadoutCamera.verticalFov = Number((event as CustomEvent).detail.value));
		OptionsManagerEvents.addEventListener('app.cameras.orbit.polarrotation', event => this.#appViewer.setPolarRotation((event as CustomEvent).detail.value));
		OptionsManagerEvents.addEventListener('app.cameras.default.orthographic', event => loadoutCamera.setProjection((event as CustomEvent).detail.value ? CameraProjection.Orthographic : CameraProjection.Perspective));

		OptionsManagerEvents.addEventListener('app.itemselector.hideitemname', event => {
			if ((event as CustomEvent).detail.value) {
				document.documentElement.style.setProperty('--hide-item-name', 'none');
			} else {
				document.documentElement.style.removeProperty('--hide-item-name');
			}
		});

		OptionsManagerEvents.addEventListener('app.market.automarket', event => {
			if ((event as CustomEvent).detail.value) {
				show(this.#appMarketPrices.htmlElement);
			} else {
				hide(this.#appMarketPrices.htmlElement);
			}
		});
		OptionsManagerEvents.addEventListener('app.market.currency', async event => {
			await MarketPrice.setCurrency((event as CustomEvent).detail.value);
			CharacterManager.refreshMarketPrices();
		});

		let a: EventListenerOrEventListenerObject;
		let b: EventListener;

		OptionsManagerEvents.addEventListener('app.itemselector.columns', event => document.body.style.cssText = '--item-selector-columns: ' + (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('engine.render.silhouettemode', event => this.#setSilhouetteMode((event as CustomEvent).detail.value));
		OptionsManagerEvents.addEventListener('engine.render.silhouettecolor', event => this.#setSilhouetteColor((event as CustomEvent).detail.value));

		OptionsManagerEvents.addEventListener('app.shortcuts.*', event => {
			ShortcutHandler.setShortcut('*', (event as CustomEvent).detail.name, (event as CustomEvent).detail.value);
		});

		OptionsManagerEvents.addEventListener('app.lights.ambient.color', event => this.#ambientLight.color = hexToRgb((event as CustomEvent).detail.value));
		OptionsManagerEvents.addEventListener('app.lights.ambient.intensity', event => this.#ambientLight.intensity = (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('app.lights.pointlights.*', event => {
			let lightParams = (event as CustomEvent).detail.name.replace('app.lights.pointlights.', '').split('.');
			let light = this.#pointLights[lightParams[0]];
			if (light) {
				switch (lightParams[1]) {
					case 'position':
						light.position = stringToVec3((event as CustomEvent).detail.value);
						break;
					case 'color':
						light.color = hexToRgb((event as CustomEvent).detail.value);
						break;
					case 'visible':
						light.visible = (event as CustomEvent).detail.value ? undefined : false;
						break;
					default:
						light[lightParams[1]] = (event as CustomEvent).detail.value;
				}
			}
		});

		OptionsManager.init({ json: optionsmanager });
	}

	#initListeners() {
		window.addEventListener('beforeunload', () => this.#beforeUnload());

		Controller.addEventListener(EVENT_CHARACTERS_LOADED, () => this.#appCharacterSelector.show());
		Controller.addEventListener(EVENT_OPEN_CHARACTER_SELECTOR, () => this.#appCharacterSelector.show());
		Controller.addEventListener(EVENT_CHARACTER_SELECTED, event => this.#characterSelected((event as CustomEvent).detail.characterId));

		Controller.addEventListener(EVENT_TOOLBAR_PLAY, () => Graphics.speed = 1.0);
		Controller.addEventListener(EVENT_TOOLBAR_PAUSE, () => Graphics.speed = 0.0);
		Controller.addEventListener(EVENT_TOOLBAR_SHARE, () => this.#shareLoadout());
		Controller.addEventListener(EVENT_TOOLBAR_PICTURE, () => this.#savePicture());
		Controller.addEventListener(EVENT_TOOLBAR_EXPORT_FBX, () => this.#exportToFBX());
		Controller.addEventListener(EVENT_TOOLBAR_EXPORT_OBJ, () => this.#export3D());
		if (ENABLE_PATREON_POWERUSER) {
			Controller.addEventListener(EVENT_EXPORT_OBJ, () => this.#export3D2());
		}
		Controller.addEventListener(EVENT_TOOLBAR_ABOUT, () => showAboutLayer());
		Controller.addEventListener(EVENT_TOOLBAR_BUG, () => showBugNotification());
		Controller.addEventListener(EVENT_TOOLBAR_PATREON, () => this.#handlePatreonClick());

		Controller.addEventListener(EVENT_PANEL_OPTIONS_OPENED, () => Controller.dispatchEvent(new CustomEvent(EVENT_CLOSE_ITEM_LIST)));
		Controller.addEventListener(EVENT_PANEL_OPTIONS_CLOSED, () => Controller.dispatchEvent(new CustomEvent(EVENT_OPEN_ITEM_LIST)));
		Controller.addEventListener(EVENT_TOOLBAR_ADVANCED_OPTIONS, () => OptionsManager.showOptionsManager());

		Controller.addEventListener(EVENT_RESET_CAMERA, () => this.#resetCamera());
	}

	#initHTML() {
		this.#shadowRoot = createShadowRoot('div', {
			class: 'application',
			parent: document.body,
		});
		//this.#shadowRoot = this.#htmlElement.attachShadow({ mode: 'closed' });
		I18n.observeElement(this.#shadowRoot);
		this.#initCSS();

		this.#shadowRoot.append(
			this.#appToolbar.htmlElement,
			createElement('div', {
				class: 'maincontent',
				childs: [
					this.#appOptions.htmlElement,
					this.#appItemSlots.htmlElement,
					createElement('div', {
						class: 'viewer-container',
						childs: [
							this.#appViewer.htmlElement,
							this.#appMarketPrices.htmlElement,
							this.#appStyleSelector.htmlElement,
							this.#appUnitSelector.htmlElement,
						],
					}),
					this.#appItemList.htmlElement,
					ENABLE_PATREON_BASE ? this.#appAdPanel.htmlElement : null,
				]
			}),
			//this.#appStatusbar.htmlElement,
			this.#appCharacterSelector.htmlElement,
		);

		if (ENABLE_PATREON_POWERUSER) {
			this.#shadowRoot.append(this.#appExport3DPopover?.htmlElement);
		}

		this.#appToolbar.setMode();
		if (ENABLE_PATREON_BASE) {
			((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
		}
	}

	#initCSS() {
		shadowRootStyle(this.#shadowRoot, applicationCSS);
		shadowRootStyle(this.#shadowRoot, loadoutCSS);
		shadowRootStyle(this.#shadowRoot, characterSelectorCSS);
		shadowRootStyle(this.#shadowRoot, export3dPopoverCSS);
		shadowRootStyle(this.#shadowRoot, viewerCSS);
		shadowRootStyle(this.#shadowRoot, toolbarCSS);
		shadowRootStyle(this.#shadowRoot, styleSelectorCSS);
		shadowRootStyle(this.#shadowRoot, statusbarCSS);
		shadowRootStyle(this.#shadowRoot, marketPricesCSS);
		shadowRootStyle(this.#shadowRoot, itemSlotsCSS);
		shadowRootStyle(this.#shadowRoot, itemListItemCSS);
		shadowRootStyle(this.#shadowRoot, itemListCSS);
	}

	#iniRepositories() {
		Repositories.addRepository(new MergeRepository('dota2', new WebRepository('dota2', DOTA2_REPOSITORY)));
		Source2ModelManager.loadManifest('dota2');
		Source2ParticleManager.loadManifests('dota2');
	}

	#characterSelected(characterId) {
		const character = CharacterManager.getCharacter(characterId);
		if (!character) {
			return;
		}
		this.#appToolbar.setActivity(character.getActivity());
		this.#appToolbar.setModifiers(character.getModifiers());
		this.#appItemSlots.setCharacter(character);
		this.#appItemList.setCharacter(character);
	}

	set backGroundColor(hex) {
		if (hex) {
			let rgb = hexToRgb(hex);
			Graphics.clearColor(rgb);
			loadoutColorBackground.setColor(rgb);

			(this.#shadowRoot.host as HTMLElement).style.backgroundColor = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ', 1.0)';
			let luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

			//this.invertFilter = (luminance > 0.7);

			//this.htmlCanvasToolBar.style.backgroundColor = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ', 0.5)';

			/*if (hex != this.htmlColorPicker.color.hex/*.substring(0, 7)* /) {
				this.htmlColorPicker.setColor(hex.toLowerCase());
			}*/
		}
	}

	#beforeUnload() {
		if (OptionsManager.getItem('app.cameras.perspective.saveposition')) {
			OptionsManager.setItem('app.cameras.orbit.position', loadoutCamera.position.join(' '));
			OptionsManager.setItem('app.cameras.orbit.target', this.#appViewer.getCameraTarget().join(' '));
		}
	}

	#setSilhouetteMode(silhouetteMode) {
		if (silhouetteMode) {
			Graphics.setIncludeCode('silhouetteMode', '#define SILHOUETTE_MODE');
		} else {
			Graphics.setIncludeCode('silhouetteMode', '#undef SILHOUETTE_MODE');
		}
	}

	#setSilhouetteColor(silhouetteColor) {
		let rgb = hexToRgb(silhouetteColor);
		Graphics.setIncludeCode('silhouetteColor', `#define SILHOUETTE_COLOR vec4(${rgb[0]},${rgb[1]},${rgb[2]},${rgb[3]})`);
	}

	#initLights() {
		this.#lightsContainer = loadoutScene.addChild(new Group({ name: 'Lights' }));
		this.#ambientLight = this.#lightsContainer.addChild(new AmbientLight());
		this.#pointLights = [];
		for (let i = 0; i < 3; ++i) {
			this.#pointLights.push(this.#lightsContainer.addChild(new PointLight({ intensity: 0.0 })));
		}
	}

	async #uploadLoadout(loadout) {
		try {
			const response = await fetch(SHARE_LOADOUT_URL, { method: 'POST', body: JSON.stringify(loadout) });
			if (!response) {
				return null;
			}
			const responseJSON = await response.json();
			if (!responseJSON) {
				return null;
			}
			if (responseJSON.success) {
				return responseJSON.result;
			} else {
				return null;
			}
		} catch (e) { }
		return null;
	}

	async #shareLoadout() {
		const loadout = CharacterManager.exportLoadout();
		const result = await this.#uploadLoadout(loadout);

		if (!result) {
			addNotification(I18n.getString('#failed_to_upload_this_loadout'), NotificationType.Error, 5);
			return;
		}

		const loadoutUrl = `https://dotaloadout.com/@loadout/${result}`

		let notificationText = `${I18n.getString('#share_this_loadout')}<input value='${loadoutUrl}'>`;
		try {
			navigator.clipboard.writeText(loadoutUrl).then(
				() => addNotification(I18n.getString('#share_link_clipboard_ok'), NotificationType.Info, 5),
				() => addNotification(notificationText, NotificationType.Info, 15)
			);
		} catch (e) {
			addNotification(notificationText, NotificationType.Info, 15);
		}
	}

	async #loadUrlLoadout() {
		let pathname = document.location.pathname;

		const loadoutResult = /\/@loadout\/(.*)/.exec(pathname);
		if (loadoutResult) {
			this.#loadShareLoadout(loadoutResult[1]);
		} else {
			this.#loadOldLoadout();
		}
	}

	async #loadShareLoadout(loadoutId) {
		const response = await fetch(SHARE_LOADOUT_URL + loadoutId);
		const responseJSON = await response.json();
		if (responseJSON.success) {
			CharacterManager.importLoadout(responseJSON.result);
			this.#appCharacterSelector.hide();
		}
	}

	async #loadOldLoadout() {
		const searchParams = new URLSearchParams(document.location.search);

		const hero = searchParams.get('hero');
		const ids = searchParams.getAll('id[]');

		if (hero) {
			const items: any[] = [];
			for (const id of ids) {
				items.push({
					id: Number(id),
				});
			}

			const loadout = {
				characters: [{
					npc: hero,
					items: items,
				}],
			};

			CharacterManager.importLoadout(loadout);
			this.#appCharacterSelector.hide();
		}
	}

	#savePicture() {
		const value = this.#getPictureSize();
		Graphics.savePicture(loadoutScene, loadoutCamera, 'dotaloadout.png', Number(value.w), Number(value.h));
	}

	#getPictureSize() {
		let option = OptionsManager.getItem('app.picture.size');
		if (option) {
			let regexSize = /(\d*)[\*|x|X](\d*)/i;
			var result = regexSize.exec(option);
			if (result && result[1] && result[2]) {
				return { w: result[1], h: result[2] };
			}
		}
		return { w: undefined, h: undefined };
	}

	async #exportToFBX() {
		if (ENABLE_PATREON_POWERUSER) {
			let binaryFBX = await exportToBinaryFBX(loadoutScene);
			saveFile(new File([binaryFBX], 'dotaloadout.com.fbx'));
		} else {
			addNotification(I18n.getString('#feature_patreon'), NotificationType.Warning, 10);
		}
	}


	async #export3D() {
		if (ENABLE_PATREON_POWERUSER) {
			if (OptionsManager.getItem('app.objexporter.askoptions')) {
				this.#appExport3DPopover?.show();
			} else {
				this.#export3D2();
			}
		} else {
			addNotification(I18n.getString('#feature_patreon'), NotificationType.Warning, 10);
		}
	}

	async #export3D2() {
		if (!ENABLE_PATREON_POWERUSER) {
			// For obscure reasons, this method is not tree-shaked even when nothings calls it
			return;
		}
		let subdivisions = 0;
		if (OptionsManager.getItem('app.objexporter.subdivide')) {
			subdivisions = OptionsManager.getItem('app.objexporter.subdivide.iterations');
		}
		let files = await new ObjExporter().exportMeshes({
			meshes: loadoutScene.getMeshList(),
			exportTexture: OptionsManager.getItem('app.objexporter.exporttextures'),
			singleMesh: OptionsManager.getItem('app.objexporter.singlemesh'),
			digits: 4,
			subdivisions: subdivisions,
			mergeTolerance: OptionsManager.getItem('app.objexporter.mergevertices') ? 0.001 : 0,
		});

		for (let file of files) {
			saveFile(file);
			await setTimeoutPromise(200);
		}
	}

	#resetCamera() {
		OptionsManager.resetItem('app.cameras.orbit.position');
		OptionsManager.resetItem('app.cameras.orbit.quaternion');
		OptionsManager.resetItem('app.cameras.orbit.target');
		loadoutScene.addChild(loadoutCamera);
	}

	#handlePatreonClick() {
		if (PATREON_IS_LOGGED) {
			location.assign('/patreon/logout');
		} else {
			location.assign('/patreon/login');
		}
	}

	#setupAnalytics() {
		if (PRODUCTION && ENABLE_PATREON_BASE) {
			createElement('script', {
				src: `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`,
				parent: document.body,
				async: 1,
			});
			createElement('script', {
				innerText: `window.dataLayer = window.dataLayer || [];
				function gtag(){dataLayer.push(arguments);}
				gtag('js', new Date());

				gtag('config', '${GOOGLE_ANALYTICS_ID}');`,
				parent: document.body,
			});
		}
	}
}
new Application();
