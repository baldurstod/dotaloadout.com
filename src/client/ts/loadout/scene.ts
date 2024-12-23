import { Camera, ColorBackground, Scene, SceneExplorer } from 'harmony-3d';

export const loadoutScene = new Scene();
export const loadoutColorBackground = new ColorBackground();
export const loadoutCamera = new Camera({ nearPlane: 10, farPlane: 5000 });

new SceneExplorer().setScene(loadoutScene);
loadoutScene.activeCamera = loadoutCamera;
loadoutScene.addChild(loadoutCamera);
loadoutScene.background = loadoutColorBackground;
