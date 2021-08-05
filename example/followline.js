import { Robot } from '../out/lib_class.js';

const roland = new Robot('http://192.168.0.1:5000/io');

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
const REFRESH_RATE_MS = 5;
const SPEED = 15;
// between 0 and 1
// increment these to sharpen turn angle
const TURN_SPEED_MIN_MODIFIER = .9;
const TURN_SPEED_MED_MODIFIER = 1.3;
const TURN_SPEED_MAX_MODIFIER = 1.9;

let lastInput = [1,1,1,1];
let mode = 'normal';

/*
const tryToGetBackToLine = () => {
    return new Promise(async resolve => {

        mode = 'getback';

        console.log('Trying to find my way back')

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

} */

// sharp turn until back on track
// direction is [-1 - 1]
const turnUntilLineFound = (direction) => {
    return new Promise(async resolve => {
        mode = 'getback';

        // 5 sec timeout
        let tempRun = true;
        setTimeout(() => { tempRun = false; }, 5000);

        while(tempRun){
            const input = invertSensorInput( await roland.getSensorData() ) ;

            // path found
            if(input[0]+input[1]+input[2]+input[3] != 0 ){
                roland.LED({r:1,g:0,b:0});

                // go back to normal
                tempRun = false;
                mode = 'normal'
                // pass latest input
                resolve(input);
                break;
            }

            // keep turning
            roland.move({left:3*SPEED*direction, right:6*SPEED* -direction});
            await sleep(REFRESH_RATE_MS);
        }

        // no luck, stop 
        roland.move();
        roland.LED({r:1,g:0,b:0});

        resolve();
    }); 
}

const TRACK_LEFT_TIMEOUT = 500;
const NUMBER_OF_RECORDS = 50;

let lastInputTime = new Date().valueOf();
let lastCommands = [];



const updateLastCommands = (newest) => {
    if(lastCommands.length >= NUMBER_OF_RECORDS){
        lastCommands.pop();
        lastCommands.unshift(newest);
    }
}

const getLastGeneralDirection = () => {
    var left, right = 0;
    lastCommands.forEach(x => {
        left += x[0];
        right += x[3];
    });

    return [left, right];
}

const getDirection = async(input) => {
    let [lo, li, ri, ro] = input;

    // no input within timeout
    if( lo+ro+ri+li == 0 && new Date().valueOf() > lastInputTime + TRACK_LEFT_TIMEOUT ){
        // off-track
        const [left, right] = getLastGeneralDirection();

        input = await turnUntilLineFound(left > right ? -1 : 1);
    
        if(input === undefined){ roland.move(); process.exit(0); return; }

        [lo, li, ri, ro] = input;
    }

    // check if we're off track
    // no input
    /* if( lo+ro+ri+li == 0 && mode != 'getback'){
        // where did we get lost
        var inTmp;
        // curve to the left - turn left
        if(lastInput[0] || lastInput[1] ){
            inTmp = await turnUntilLineFound(-1);
        // turn right
        } else if( lastInput[2] || lastInput[3] ){
            inTmp = await turnUntilLineFound(1);
        
        // we fucked up
        } else {
            // update sensor variables if we somehow wandered back
            inTmp = await turnUntilLineFound(1);
        }

        // shutdown
        if(inTmp == undefined){ roland.move(); process.exit(0); return; }

        [lo, li, ri, ro] = inTmp;

    } // */

    // console.log(`${lo} | ${li} | ${ri} | ${ro} `);  // DEBUG

    // determine the direction/curveture of the line ahead
    // <------ left | right --->
    // -1 -.66 -.33 0 .33 .66 1

    lastInput = [lo, li, ri, ro];

    lastInputTime = new Date().valueOf();
    updateLastCommands(lastInput);

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

    console.log(target);

    return target;
}

/* const test_inputs = [
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
] */

const invertSensorInput = (input) => {
    return [ input[0]==0?1:0, input[1]==0?1:0, input[2]==0?1:0, input[3]==0?1:0 ];  // xd fml
}

/* // TEST
var i = 0;
while(i < test_inputs.length - 1){    
    const direction = await getDirection( test_inputs[i] );
    console.log(direction);

    console.log(turn(direction, SPEED));

    await sleep(REFRESH_RATE_MS);

    i++;
} // */


while(run){
    const sensDat = invertSensorInput( await roland.getSensorData() );
    
    console.log(`detected ${JSON.stringify(sensDat)}`);

    const direction = await getDirection( sensDat );

    console.log(direction);

    roland.move(turn(direction, SPEED));

    // console.log(turn(direction, SPEED));

    await sleep(REFRESH_RATE_MS);
} //*/




