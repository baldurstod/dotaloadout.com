import { AmbientLight, Camera, ContextObserver, GraphicsEvent, Graphics, GraphicsEvents, HALF_PI, OrbitControl, WebGLStats, Composer } from 'harmony-3d';
import { createElement } from 'harmony-ui';
import { Controller } from '../controller';
import { loadoutCamera, loadoutScene } from '../loadout/scene';

export class Viewer {
	#htmlElement;
	#htmlCanvas;
	#renderer;
	#orbitControl;
	#composer: Composer;
	constructor() {
		this.#initHTML();
		this.#orbitControl = new OrbitControl(loadoutCamera);
		loadoutCamera.position = [100, 0, 40];
		this.#orbitControl.setTargetPosition([0, 0, 40]);
		this.#initRenderer();
	}

	#initHTML() {
		this.#htmlElement = createElement('div', {
			class: 'viewer',
			childs: [
				this.#htmlCanvas = createElement('canvas'),
			],
		})
		return this.#htmlElement;
	}

	#initRenderer() {
		this.#renderer = new Graphics().initCanvas({
			canvas: this.#htmlCanvas,
			alpha: true,
			autoResize: true,
			preserveDrawingBuffer: true,
			premultipliedAlpha: false
		});

		this.#renderer.clearColor([0.5, 0.5, 0.5, 1]);

		GraphicsEvents.addEventListener(GraphicsEvent.Tick, (event: CustomEvent) => {
			WebGLStats.tick();
			if (this.#composer?.enabled) {
				this.#composer.render(event.detail.delta);
			} else {
				new Graphics().render(loadoutScene, loadoutScene.activeCamera, event.detail.delta);
			}
		});

		ContextObserver.observe(GraphicsEvents, loadoutCamera);
		this.#renderer.play();
	}

	get htmlElement() {
		return this.#htmlElement;
	}

	setCameraTarget(target) {
		this.#orbitControl.target.position = target;
	}

	getCameraTarget() {
		return this.#orbitControl.target.position;
	}

	setPolarRotation(polarRotation) {
		if (polarRotation) {
			this.#orbitControl.minPolarAngle = -Infinity;
			this.#orbitControl.maxPolarAngle = Infinity;
		} else {
			this.#orbitControl.minPolarAngle = HALF_PI;
			this.#orbitControl.maxPolarAngle = HALF_PI;
		}
	}
}
