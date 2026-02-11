import { Character } from "./loadout/characters/character";

export const EVENT_CHARACTERS_LOADED = 'charactersloaded';
export const EVENT_CHARACTER_SELECTED = 'characterselected';
export const EVENT_CHARACTER_ITEM_ADDED = 'characteritemadded';
export const EVENT_CHARACTER_ITEM_REMOVED = 'characteritemremoved';
export const EVENT_CHARACTER_UNITS_CHANGED = 'characterunitschanged';
export const EVENT_CHARACTER_PERSONA_CHANGED = 'characterpersonachanged';
export const EVENT_ITEMS_LOADED = 'itemssloaded';
export const EVENT_ITEM_CLICK = 'itemclick';
export const EVENT_SLOT_CLICK = 'slotclick';
export const EVENT_OPEN_CHARACTER_SELECTOR = 'opencharacterselector';
export const EVENT_SET_MARKET_PRICES = 'setmarketprices';
export const EVENT_EXPORT_OBJ = 'export-obj';

export const EVENT_REMOVE_ITEM = 'remove-item';

export const EVENT_CLOSE_ITEM_LIST = 'close-item-list';
export const EVENT_OPEN_ITEM_LIST = 'open-item-list';

export const EVENT_TOOLBAR_SHARE = 'toolbar-share';
export const EVENT_TOOLBAR_PICTURE = 'toolbar-picture';
export const EVENT_TOOLBAR_EXPORT_FBX = 'toolbar-export-fbx';
export const EVENT_TOOLBAR_EXPORT_OBJ = 'toolbar-export-obj';
export const EVENT_TOOLBAR_OPTIONS = 'toolbar-options';
export const EVENT_TOOLBAR_ADVANCED_OPTIONS = 'toolbar-advanced-options';
export const EVENT_TOOLBAR_BUG = 'toolbar-bug';
export const EVENT_TOOLBAR_ABOUT = 'toolbar-about';
export const EVENT_TOOLBAR_PLAY = 'toolbar-play';
export const EVENT_TOOLBAR_PAUSE = 'toolbar-pause';
export const EVENT_TOOLBAR_PATREON = 'toolbar-patreon';
export const EVENT_TOOLBAR_ACTIVITY_SELECTED = 'toolbar-activity-selected';
export const EVENT_TOOLBAR_ACTIVITY_MODIFIERS = 'toolbar-activity-modifiers';

export const EVENT_PANEL_OPTIONS_OPENED = 'panel-options-opened';
export const EVENT_PANEL_OPTIONS_CLOSED = 'panel-options-closed';

export const EVENT_RESET_CAMERA = 'reset-camera';

export type CharacterSelected = {
	characterId: string,
};

export type ItemClick = {
	character: Character,
	itemId: string,
};

export type PersonaChanged = number;

export type SlotClick = string;
