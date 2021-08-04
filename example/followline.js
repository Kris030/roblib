import { robot } from '../out/lib_class.js';

const roland = new robot('http://192.168.0.1:5000/io');

const sleep = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)) }

await roland.init();
console.log('Init...');

let run = true;

// time to execute (in seconds)
if(process.argv[2] && process.argv[2].includes('-t=') ) {
    var time = parseInt(process.argv[2].split('t=')[1]);

    console.log(time);

    setTimeout(() => { 
        console.log('STOP'); 
        run = false; 
        roland.move({left: 0, right: 0}); 
    }, time);
}

// settings
const REFRESH_RATE_MS = 10;
const SPEED = 2;
// between 0 and 1
// increment these to sharpen turn angle
const TURN_SPEED_MIN_MODIFIER = .6;
const TURN_SPEED_MED_MODIFIER = .95;
const TURN_SPEED_MAX_MODIFIER = 1.5;

let lastInput = [1,1,1,1];
let mode = 'normal';

const tryToGetBackToLine = () => {
    return new Promise(resolve => {

        mode = 'getback';

        // fuck it just go forward for 2 secs, if no input move backwards
        let tempRun = true;
        setTimeout(() => { tempRun = false; }, 2000);

        while(tempRun){
            const input = invertSensorInput( await roland.getSensorData() ) ;

            // path found
            if(input[0]+input[0]+input[0]+input[0] != 0 ){
                // go back to normal
                tempRun = false;
                mode = 'normal'
                // pass latest input
                resolve(input);
                break;
            }

            // go forward
            roland.move({ left:2, right: 2 });
            await sleep(REFRESH_RATE_MS);
        }

        // move backwards
        // if nothing was found in 3secs, stop
        tempRun = true;
        setTimeout(() => { tempRun = false; }, 3000);

        while(tempRun){
            const input = invertSensorInput( await roland.getSensorData() ) ;

            // path found
            if(input[0]+input[0]+input[0]+input[0] != 0 ){
                // go back to normal
                tempRun = false;
                mode = 'normal'
                // pass latest input
                resolve(input);
                break;
            }

            // go backwards
            roland.move({ left:-3, right: -3 });
            await sleep(REFRESH_RATE_MS);
        }

        // no luck, stop 
        roland.move();
        roland.LED({r:1,g:0,b:0});

        resolve();
    }); 

}

// sharp turn until back on track
// direction is [-1 - 1]
const turnUntilLineFound = (direction) => {
    return new Promise(resolve => {
        mode = 'getback';

        // 5 sec timeout
        let tempRun = true;
        setTimeout(() => { tempRun = false; }, 5000);

        while(tempRun){
            const input = invertSensorInput( await roland.getSensorData() ) ;

            // path found
            if(input[0]+input[0]+input[0]+input[0] != 0 ){
                // go back to normal
                tempRun = false;
                mode = 'normal'
                // pass latest input
                resolve(input);
                break;
            }

            // keep turning
            roland.move(turn(direction, TURN_SPEED_MAX_MODIFIER));
            await sleep(REFRESH_RATE_MS);
        }

        // no luck, stop 
        roland.move();
        roland.LED({r:1,g:0,b:0});

        resolve();
    }); 
}

const getDirection = (input) => {
    const [lo, li, ri, ro] = input;

    // check if we're off track
    // no input
    if( lo+ro+ri+li == 0 && mode != 'getback'){
        // where did we get lost

        // curve to the left - turn left
        if(lastInput[0] || lastInput[1] ){
            [lo, li, ri, ro] = await turnUntilLineFound(-1);
        // turn right
        } else if( lastInput[2] || lastInput[3] ){
            [lo, li, ri, ro] = await turnUntilLineFound(1);
        
        // we fucked up
        } else {
            // update sensor variables if we somehow wandered back
            [lo, li, ri, ro] = await tryToGetBackToLine();
        }

        // shutdown
        if(lo == undefined){ process.exit(0); }

    }

    // console.log(`${lo} | ${li} | ${ri} | ${ro} `);  // DEBUG

    // determine the direction/curveture of the line ahead
    // <------ left | right --->
    // -1 -.66 -.33 0 .33 .66 1

    lastInput = [lo, li, ri, ro];
    return (ro && !ri ? 1 : ro*0.33 + ri*0.33) + -( lo && !li ? 1 : lo*0.33 + li*0.33 );
}

// modifier should be the float percentage of the incrementation/decrementation [0-1]
const getSpeed = (angle, speed, modifier) => {
    //   check right | take mod% of speed - take 100+mod%           
    return { right: (angle > 0 ? speed * (1-modifier) : speed *(1+modifier)) , left: (angle < 0 ? speed * (1-modifier) : speed *(1+modifier)) };

}

const turn = (angle, speed) => {
    // given the angle, we should determine the speed (and direction) of the wheels   
    const angle_abs = Math.abs(angle);
    let target;

    // slight turn
    if(angle_abs === 0.33 ){
        target = getSpeed(angle, speed, TURN_SPEED_MIN_MODIFIER);

    // medium turn 
    } else if (angle_abs >= 0.6 && angle_abs <= 0.7){ 
        target = getSpeed(angle, speed, TURN_SPEED_MED_MODIFIER);

    // full turn
    } else if (angle_abs == 1){
        target = getSpeed(angle, speed, TURN_SPEED_MAX_MODIFIER);
    
    // go straight
    } else {
        target = { left:speed, right:speed }
    }

    return target;
}

const test_inputs = [
    [1,0,0,0],
    [1,1,0,0],
    [0,1,0,0],
    [0,1,1,0],
    [0,0,1,0],
    [0,0,1,1],
    [0,0,0,1],
    [1,0,0,1],
    [1,1,1,0],
    [1,0,1,1],
    [0,1,1,1],
    [1,1,0,1],
]

const invertSensorInput = (input) => {
    return [ input[0]==0?1:0, input[1]==0?1:0, input[2]==0?1:0, input[3]==0?1:0 ];  // xd fml
}

/* // TEST
var i = 0;
while(i < test_inputs.length - 1){    
    const direction = getDirection( test_inputs[i] );
    console.log(turn(direction, SPEED));


    await sleep(REFRESH_RATE_MS);

    i++;
} // */


while(run){
    const sensDat = await roland.getSensorData();
    // console.log(sensDat);

    const direction = getDirection( invertSensorInput( sensDat ) );

    roland.move(turn(direction, SPEED));

    // console.log(turn(direction, SPEED));

    await sleep(REFRESH_RATE_MS);
} //*/




