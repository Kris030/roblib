import { init, getSensorData, move, sleep } from '../lib.js';

await init();

let run = true, side = 'left';

setTimeout(() => run = false, 30_000);

console.log('running');
while (run) {

	const sdata = await getSensorData();

	console.log(sdata);

	let left = sdata[0] * 1.5 + sdata[1], right = sdata[2] + sdata[3] * 1.5;

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


	await sleep(100);
}

/**/