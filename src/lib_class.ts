import { Manager } from 'socket.io-client';

export class Robot {

	socket: ReturnType<Manager['socket']>;

	constructor(
		public ip: string
	) {}

	init() {
		// create manager with class ip
		const man = new Manager(this.ip);
		// create socket
		this.socket = man.socket('/io', {});

		return new Promise<void>(resolve => this.socket.on('connect', resolve));
	}

	ping() {
		this.socket.emit('ping');
		return new Promise<void>(resolve => this.socket.on('pong', resolve));
	}

	buzzer({pw = 0, ms = 0} = {}) {
		this.socket.emit('buzzer', { pw, ms });
	}

	getSensorData() {
		this.socket.emit('tracksensor');
		return new Promise<[number, number, number, number]>(res => 
			this.socket.once('return-tracksensor', ( { data } ) => res(data))
		);
	};

	move({ left = 0, right = 0 } = {}) {
		if (left < -100 || left > 100 || right < -100 || right > 100)
			throw `Values should be between -100 and 100`;
		
		this.socket.emit('move', { left, right });
	};

	LED({ r = 0, g = 120, b = 180 } = {}) {
		const min = Math.min(r, g, b), max = Math.max(r, g, b);
		if (min < 0 || max > 255)
			throw `Values should be between 0 and 255`;

		this.socket.emit('led', { r, g, b });
	};
	
	stop() { this.socket.emit('stop'); }

	servo(absoluteDegree: number) {
		if (absoluteDegree < -90 || absoluteDegree > 90)
			throw 'Values should be between -90 and 90';
		this.socket.emit('servo', { degree: absoluteDegree });
	}

	exit(stops = false) {
		if (stops)
			this.stop();
		
		this.socket.close();
	}
}
