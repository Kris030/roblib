import { SpeechClient } from '@google-cloud/speech';
import * as roland from '../../out/lib.js';
import recorder from 'node-record-lpcm16';
//import { ip } from '../../config.json';

process.env['GOOGLE_APPLICATION_CREDENTIALS'] = './google_credentials.json';

const client = new SpeechClient();

await roland.init('http://192.168.0.1:5000');

const sampleRateHertz = 16000, request = {
  config: {
    encoding: 'LINEAR16',
    sampleRateHertz: sampleRateHertz,
    languageCode: 'en-US',
  },
  interimResults: false,
};

/**
    ```
    LIST OF COMMANDS

    "move [seconds] seconds with speed [0-100]"
    "turn [left/right] for [seconds] seconds with speed [0-100]"
    "turn led [red/green/blue]"
    "buzz [seconds] seconds with frequency [0-100]"
    ```
*/
const commands = [
  {
    name: 'move',
    regex: /move (\d+) seconds? with speed (\d{1,3})/,
    handler: (time, sp) => {
      const speed = Number(sp);

      roland.move({ left: speed, right: speed });
      setTimeout(roland.move, Number(time) * 1000);
      
      console.log(`moving for${time}s with ${speed} speed`);
    }
  },
  {
    name: 'turn',
    regex: /turn ((?:left)|(?:right)) for (\d+) seconds? with speed (\d{1,3})/,
    handler: (direction, time, sp) => {
      const speed = Number(sp);
      
      if (direction === 'right')
        roland.move({ left: speed, right: -speed });
      else
        roland.move({ left: -speed, right: speed });
      
      setTimeout(roland.move , Number(time) * 1000);
      
      console.log(`turning to ${direction} for ${time}s with ${speed} speed`);
    }
  },
  {
    name: 'led',
    regex: /turn led ((?:red)|(?:green)|(?:blue))/,
    handler: color => {
      
      switch(color) {
        case 'red':
          roland.LED({ r: true });
        break;
        case 'green':
          roland.LED({ g: true });
        break;
        case 'blue':
          roland.LED({ b: true });
        break;
      }
      
      console.log('turning led to ' + color);
    }
  }, 
  {
    name: 'buzz',
    regex: /buzz (\d+) seconds? with frequency (\d{1,3})/,
    handler: (time, frequency) => {
      console.log(time + ' ' + frequency);
      time = Number(time) * 1000;
      frequency = Number(frequency);

      roland.buzzer(frequency);
      setTimeout(roland.buzzer, time);

      console.log(`buzzing for ${time}ms with frequency ${frequency}hz`);
    }
  },
  {
    name: 'stop',
    regex: /stop/,
    handler: () => roland.move()
  },
  {
    name: 'explosive_diarrhea',
    regex: /explosive diarrhea/,
    handler: () => {
      roland.move({ left: -70, right: 70 });
      setTimeout(roland.move, 2000);
    }
  }
];

const tryCommand = text => {
  let rArr;

  const cmd = commands.find(c => {
    const res = c.regex.exec(text);
    if (!res)
      return false;
    
    console.log(res);
    [, ...rArr] = res;
    console.log(rArr);
    return true;
  });

  if (!cmd)
    return false;
  
  cmd.handler(...rArr);
  return true;
};

const handleTranscript = data => {
    if (data.results && data.results[0].alternatives[0]) {
        console.log(`received ${data.results[0].alternatives[0].transcript}`);
        console.log(data.results[0].alternatives);
        const transcript = data.results[0].alternatives[0].transcript.toString().trim().toLowerCase();
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
    // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
    verbose: false,
    recordProgram: 'sox', // Try also "arecord" or "sox"
    silence: '10.0',
  })
  .stream()
  .on('error', console.error)
  .pipe(recognizeStream);

console.log('Listening, press Ctrl+C to stop.');