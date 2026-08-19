import { vec3 } from 'gl-matrix';
import { CanvasLayout, CanvasView, Composer, ContextType, Graphics, GraphicsEvent, GraphicsEvents, GraphicTickEvent, HALF_PI, OrbitControl, ShaderPrecision, WebGLStats } from 'harmony-3d';
import { OptionsManager } from 'harmony-browser-utils';
import { createElement } from 'harmony-ui';
import { LOADOUT_LAYOUT, MAIN_CANVAS } from '../constants';
import { loadoutCamera, loadoutScene } from '../loadout/scene';

export class Viewer {
	#htmlElement!: HTMLElement;
	#htmlCanvas!: HTMLCanvasElement;
	#orbitControl;
	#composer?: Composer;

	constructor() {
		this.#initHTML();
		this.#orbitControl = new OrbitControl(loadoutCamera);
		loadoutCamera.setPosition([100, 0, 40]);
		this.#orbitControl.setTargetPosition([0, 0, 40]);
		//this.#initRenderer();
	}

	#initHTML(): HTMLElement {
		this.#htmlElement = createElement('div', {
			class: 'viewer',
			childs: [
				this.#htmlCanvas = createElement('canvas') as HTMLCanvasElement,
			],
		})
		return this.#htmlElement;
	}

	async initRenderer(): Promise<void> {
		await Graphics.initCanvas({
			useOffscreenCanvas: true,
			autoResize: true,
			webGL: {
				alpha: true,
				preserveDrawingBuffer: true,
				premultipliedAlpha: false,
			},
			webGPU: {
				configuration: {
					alphaMode: 'premultiplied',
				},
			}
		});


		let contextType = ContextType.WebGL;

		if (OptionsManager.getItem('engine.renderer.experimentalwebgpu')) {
			contextType = ContextType.WebGPU;
		}

		Graphics.addCanvas({
			name: MAIN_CANVAS,
			canvas: this.#htmlCanvas,
			layouts: [
				new CanvasLayout(LOADOUT_LAYOUT,
					[
						new CanvasView({
							name: 'main',
							scene: loadoutScene,
							composer: this.#composer,
						}),
					],
				),
			],
			autoResize: true,
			useLayout: LOADOUT_LAYOUT,
		});

		Graphics.setShaderPrecision(ShaderPrecision.High);
		Graphics.clearColor([0.5, 0.5, 0.5, 1]);

		GraphicsEvents.addEventListener(GraphicsEvent.Tick, (event: Event) => {
			WebGLStats.tick();
			if (this.#composer?.enabled) {
				this.#composer.render((event as CustomEvent<GraphicTickEvent>).detail.delta, {});
			} else {
				Graphics.renderMultiCanvas((event as CustomEvent<GraphicTickEvent>).detail.delta, (event as CustomEvent<GraphicTickEvent>).detail.context);
			}
		});

		//ContextObserver.observe(GraphicsEvents, loadoutCamera);
		Graphics.play();
	}

	get htmlElement(): HTMLElement {
		return this.#htmlElement;
	}

	setCameraTarget(target: vec3): void {
		this.#orbitControl.target.setPosition(target);
	}

	getCameraTarget(): vec3 {
		return this.#orbitControl.target.getPosition();
	}

	setPolarRotation(polarRotation: boolean): void {
		if (polarRotation) {
			this.#orbitControl.minPolarAngle = -Infinity;
			this.#orbitControl.maxPolarAngle = Infinity;
		} else {
			this.#orbitControl.minPolarAngle = HALF_PI;
			this.#orbitControl.maxPolarAngle = HALF_PI;
		}
	}
}
