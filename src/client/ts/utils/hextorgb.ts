import { vec4 } from 'gl-matrix';

export function hexToRgb(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? vec4.fromValues(
			parseInt(result[1], 16) / 255.0,
			parseInt(result[2], 16) / 255.0,
			parseInt(result[3], 16) / 255.0,
			parseInt(result[4], 16) / 255.0,
		) : vec4.create();
}
