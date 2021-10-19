import { init, move, LED, buzzer } from '../../lib';
import { SpeechClient } from '@google-cloud/speech';
import { config as dotenv } from 'dotenv';
import recorder from 'node-record-lpcm16';

dotenv();

process.env['GOOGLE_APPLICATION_CREDENTIALS'] ||= './google_credentials.json';

const client = new SpeechClient();

await init(process.env['ROBLIB_IP'] || '192.168.0.1:5000');

const sampleRateHertz = 16000,
	request = {
		config: {
			encoding: 'LINEAR16' as 'LINEAR16', // bruh momentum
			sampleRateHertz: sampleRateHertz,
			languageCode: 'en-US',
		},
		interimResults: false,
	};

/**
	```plain
	COMMANDS' SYNTAX

	MOVE: move [seconds] seconds with speed [0..100]
	TURM: turn [left | right] for [seconds] seconds with speed [0..100]
	BUZZ: buzz [seconds] seconds with frequency [0..100]
	LED:  turn led [red | green | blue]
	```
*/
const commands = [
	{
		name: 'move',
		regex: /move (\d+) seconds? with speed (\d{1,3})/,
		handler: (time: string, sp: string) => {
			const speed = Number(sp);

			move({ left: speed, right: speed });
			setTimeout(move, Number(time) * 1000);

			console.log(`moving for${time}s with ${speed} speed`);
		},
	},
	{
		name: 'turn',
		regex: /turn ((?:left)|(?:right)) for (\d+) seconds? with speed (\d{1,3})/,
		handler: (direction: string, time: string, sp: string) => {
			const speed = Number(sp);

			if (direction === 'right')
				move({ left: speed, right: -speed });
			else
				move({ left: -speed, right: speed });

			setTimeout(move, Number(time) * 1000);

			console.log(
				`turning to ${direction} for ${time}s with ${speed} speed`
			);
		},
	},
	{
		name: 'led',
		regex: /turn led ((?:red)|(?:green)|(?:blue))/,
		handler: (color: 'red' | 'green' | 'blue') => {
			switch (color) {
				case 'red':
					LED({ r: true });
					break;
				case 'green':
					LED({ g: true });
					break;
				case 'blue':
					LED({ b: true });
					break;
			}

			console.log('turning led to ' + color);
		},
	},
	{
		name: 'buzz',
		regex: /buzz (\d+) seconds? with frequency (\d{1,3})/,
		handler: (time: string | number, frequency: string | number) => {
			console.log(time + ' ' + frequency);
			time = Number(time) * 1000;
			frequency = Number(frequency);

			buzzer(frequency);
			setTimeout(buzzer, time);

			console.log(`buzzing for ${time}ms with frequency ${frequency}hz`);
		},
	},
	{
		name: 'stop',
		regex: /stop/,
		handler: () => move(),
	},
	{
		name: 'explosive_diarrhea',
		regex: /explosive diarrhea/,
		handler: () => {
			move({ left: -70, right: 70 });
			setTimeout(move, 2000);
		},
	},
];

const tryCommand = (text: string) => {
	let rArr: string[];

	const cmd = commands.find(c => {
		const res = c.regex.exec(text);
		if (!res)
			return false;

		[, ...rArr] = res;

		return true;
	});

	if (!cmd)
		return false;
	
	cmd.handler(...rArr as [string, string, string]);
	return true;
};

const handleTranscript = (data: any) => {
	if (data.results) {

		const transcript = data.results[0].alternatives[0].transcript
			.toString()
			.trim()
			.toLowerCase();
		
		console.log(`Received '${transcript}' with confidence ${data}`);

		tryCommand(transcript);
	} else
		console.log('Something went wrong');
};

const recognizeStream = client
	.streamingRecognize(request)
		.on('error', console.error)
		.on('data', handleTranscript);

recorder
	.record({
		sampleRateHertz: sampleRateHertz,
		threshold: 0,
		verbose: false,
		recordProgram: 'sox', // Try also 'arecord' or 'sox'
		silence: '10.0',
	})
		.stream()
		.on('error', console.error)
		.pipe(recognizeStream);

console.log('Listening!');
