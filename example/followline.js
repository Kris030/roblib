import { robot } from '../out/lib_class.js';

const test = new robot('http://127.0.0.1:5000/io');

await test.init();
console.log('Init...');

let run = true;
let direction = 0;

const getDirection = (input) => {
    console.log(input);

    // const lo, li, ri, ro = input;

    console.log(`${lo} | ${li} | ${ri} | ${ro} `);

    // determine the direction/curveture of the line
    // <------ left | right --->
    // -1 -.66 -.33 0 .33 .66 1
    return  (ro && !ri ? 1 : ro*0.33 + ri+0.33) -  -( lo && !li ? 1 : lo*0.33 + li+0.33 ) ;
}


var a = await test.ping();
console.log(a);

/* while(run){
    console.log('loop called');

    getSensorData().then(x => {
        console.log(x);
    });
   
   
    await sleep(500);
} */





