import { Manager } from 'socket.io-client';


export class robot {

	ip:string;
	socket: ReturnType<Manager['socket']>;


	constructor(ip){
		this.ip = ip;
	}

	init(){
		// create manager with class ip
		const man = new Manager(this.ip);
		// create socket
		this.socket = man.socket('/io', {});

		this.socket.onAny((event) => {
			console.log(`event: ${event}`);
		});

		return new Promise<void>(resolve => this.socket.on('connect', resolve));
	}

	ping(){
		this.socket.emit('ping');

		return new Promise<void>(resolve => this.socket.on('pong', resolve));
	}

	getSensorData () {
		this.socket.emit('tracksensor');
		return new Promise<[number, number, number, number]>(res => 
			this.socket.once('return-tracksensor', ( { data } ) => res(data))
		);
	};

	move ({ left = 0, right = 0 } = {}) {
		if (left < -100 || left > 100 || right < -100 || right > 100)
			throw `Values should be between -100 and 100`;
		
		this.socket.emit('move', { left, right });
	};

	LED ({ r = 0, g = 120, b = 180 } = {}) {
		const min = Math.min(r, g, b), max = Math.max(r, g, b);
		if (min < 0 || max > 255)
			throw `Values should be between 0 and 255`;

		this.socket.emit('led', { r, g, b });
	};
	
	stop () { this.socket.emit('stop'); }
	
	

}
