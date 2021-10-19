import * as roland from "../lib";
const sleep = roland.sleep;

require("dotenv").config();
const DEBUG = process.env["ROBLIB_DEBUG"] === "true";

await roland.init(process.env["ROBLIB_IP"] || "192.168.0.1:5000");
console.log("Init...");

let run = true;
let lastInputTime: number | undefined;

// SETTINGS
const REFRESH_RATE_MS = 5;
const SPEED = 12;
// increment these to sharpen turn angle
const TURN_SPEED_MIN_MODIFIER = 0.9;
const TURN_SPEED_MED_MODIFIER = 1.3;
const TURN_SPEED_MAX_MODIFIER = 1.9;
const TRACK_LEFT_TIMEOUT = 1000;

const getDirection = async input => {
    let [lo, li, ri, ro] = input;

    // no input within timeout
    if (
        lo + ro + ri + li == 0 &&
        new Date().valueOf() > lastInputTime + TRACK_LEFT_TIMEOUT
    ) {
        console.log("Lost Track ...");
        // off-track

        process.exit(1);
    } else {
        lastInputTime = new Date().valueOf();
    }

    DEBUG && console.log(`${lo} | ${li} | ${ri} | ${ro} `); // DEBUG

    // determine the direction/curveture of the line ahead
    // <------ left | right --->
    // -1 -.66 -.33 0 .33 .66 1

    return (
        (ro && !ri ? 1 : ro * 0.33 + ri * 0.33) +
        -(lo && !li ? 1 : lo * 0.33 + li * 0.33)
    );
};

// get the speed to turn with
// modifier should be the float percentage of the incrementation/decrementation
const getSpeed = (angle, speed, modifier) => {
    //   check right | take mod% of speed - take 100+mod%
    return {
        right: angle > 0 ? speed * (1 - modifier) : speed * (1 + modifier),
        left: angle < 0 ? speed * (1 - modifier) : speed * (1 + modifier),
    };
};

const turn = (angle, speed) => {
    // given the angle, we should determine the speed (and direction) of the wheels
    const angle_abs = Math.abs(angle);
    let target;

    // slight turn
    if (angle_abs === 0.33) {
        target = getSpeed(angle, speed, TURN_SPEED_MIN_MODIFIER);

        // medium turn
    } else if (angle_abs >= 0.6 && angle_abs <= 0.7) {
        target = getSpeed(angle, speed, TURN_SPEED_MED_MODIFIER);

        // full turn
    } else if (angle_abs == 1) {
        target = getSpeed(angle, speed, TURN_SPEED_MAX_MODIFIER);

        // go straight
    } else {
        target = { left: speed, right: speed };
    }

    console.log(target);

    return target;
};

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

// returns 0 if 1, 1 if 0
const invertSensorInput = (input: number[]) => input.map(n => Number(!n)); // bruh moment

while (run) {
    const sensDat = invertSensorInput(await roland.getSensorData());

    DEBUG && console.log(`detected ${JSON.stringify(sensDat)}`); // DEBUG

    const direction = await getDirection(sensDat);

    DEBUG && console.log(direction); // DEBUG

    roland.move(turn(direction, SPEED));

    DEBUG && console.log(turn(direction, SPEED)); // DEBUG

    await sleep(REFRESH_RATE_MS);
} //*/
