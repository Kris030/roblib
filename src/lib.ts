import { Manager } from 'socket.io-client';

let socket: ReturnType<Manager['socket']>;
export const init = () => {

	const ip = 'http://192.168.0.1:5000/io';

	const man = new Manager(ip);

	// create socket
	socket = man.socket('/io', {});

	// connected to server
	return new Promise<void>(res => socket.on('connect', res));
};

export const getSensorData = () => {
	socket.emit('tracksensor');
	return new Promise<[number, number, number, number]>(res => 
		socket.once('return-tracksensor', ({ data }) => res(data))
	);
};

export const move = ({ left = 0, right = 0 } = {}) => {
	if (left < -100 || left > 100 || right < -100 || right > 100)
		throw `Values should be between -100 and 100`;
		socket.emit('move', { left, right });
};
	
export const LED = ({ r = 0, g = 120, b = 180 } = {}) => {
	const min = Math.min(r, g, b), max = Math.max(r, g, b);
	if (min < 0 || max > 255)
		throw `Values should be between 0 and 255`;
	socket.emit('led', { r, g, b });
};

export const stop = () => void socket.emit('stop');

export const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms));
