import speech from '@google-cloud/speech';
//@ts-ignore
import recorder from 'node-record-lpcm16';
//@ts-ignore
import dotenv from 'dotenv';

dotenv.config();
const client = new speech.SpeechClient();

import Robot from '../../src/lib_class.js';
const roland = new Robot();

await roland.init();

const encoding = 'LINEAR16', sampleRateHertz = 16000, languageCode = 'en-US';

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
  },
  interimResults: false, // If you want interim results, set this to true
};

/*
    LIST OF COMMANDS

    "move [seconds] seconds with speed [0-100]"
    "turn [left/right] [seconds] seconds with speed [0-100]"
    "turn led [red/green/blue]"
    "buzz [seconds] seconds with frequency [0-100]"

*/

const command = (transcript: string) => {
    const moveMatch = /move (\d+) seconds with speed (\d{1,3})/.exec(transcript);
    if (moveMatch) {
      const [, time, speed] = moveMatch;
      console.log(time + 's ' + speed);

      roland.move( {left: parseInt(speed), right: parseInt(speed)} );
      setTimeout(() => roland.move() , parseInt(time)*1000);

      return;
    }

    const turnMatch = /turn ((?:left)|(?:right)) for (d+) seconds with speed (\d{1,3})/.exec(transcript);
    if (turnMatch) {
      const [, direction, time, speed] = turnMatch;
      console.log(`${direction} ${time}s ${speed}`);

      roland.move( {left: direction =='right'? parseInt(speed) : -parseInt(speed), right: direction =='right'? -parseInt(speed) : parseInt(speed)} );
      setTimeout(() => roland.move() , parseInt(time)*1000);
      
      return;
    }

    const ledMatch = /turn led ((?:red)|(?:green)|(?:blue))/.exec(transcript);
    if (ledMatch) {
      const [, color] = ledMatch;
      console.log('led ' + color);

      switch(color){
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
      
      return;
    }

    const buzzMatch = /buzz (\d+) seconds with frequency (\d{1,3})/.exec(transcript);
    if (buzzMatch) {
      const [, time, frequency] = buzzMatch;
      console.log(`${time}s ${frequency}hz`);

      roland.buzzer({ pw: parseInt(time)*1000, ms:parseInt(frequency) });
      return;
    }


    if(transcript == 'explosive diarrhea'){
      roland.move({left: -70, right:70});

      setTimeout(() => roland.move(), 2000);
    }
}

const handleTranscript = (data) => {
    if( data.results && data.results[0].alternatives[0] ){
        console.log(`received ${data.results[0].alternatives[0].transcript}`);

        const transcript = data.results[0].alternatives[0].transcript.toString().toLowerCase();
        command(transcript);
    } else {
        console.log('Something went wrong');
    }
}

// Create a recognize stream
const recognizeStream = client
  .streamingRecognize(request as any)
  .on('error', console.error)
  .on('data', data => handleTranscript(data)  );

// Start recording and send the microphone input to the Speech API.
// Ensure SoX is installed, see https://www.npmjs.com/package/node-record-lpcm16#dependencies
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