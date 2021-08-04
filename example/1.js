import { init, getSensorData, move } from '../lib.js';

await init();

// left is negative

let run = true, side = 0;

setTimeout(() => run = false, 30_000);

while (run) {
	const [ lo, li, ri, ro ] = getSensorData();

	const abSide = Math.abs(side);

	let sens;
	if (abSide < 30) {
		
		if (li && ri)
			move({ left: 30, right: 30 });
		else if (li) {
			// going right
			side += 5;
			move({ left: 30, right: 10 });
		} else {
			// going left
			side -= 5;
			move({ left: 10, right: 30 });
		}

		//sens = -( lo && !li ? 1: lo * 0.33 + li * 0.33 ) + ( ro && !ri ? 1: ro * 0.33 + ri * 0.33 )
	} else if (abSide) {

	}

	if (left == right) {
		
		if (side == 'left') {
			right = 0;
			left = 1;
		} else {
			right = 1;
			left = 0;
		}

	}
	
	if (left > right) {
		move({ left: 10, right: 30 });
		side = 'left';
	} else if (right > left) {
		move({ left: 30, right: 10 });
		side = 'right';
	}


	await sleep(10);
}

