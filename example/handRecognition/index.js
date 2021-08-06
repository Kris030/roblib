import { init as rob_init, move } from './lib.js';

// the link to your model provided by Teachable Machine export panel
const url = './';

await rob_init('http://192.168.0.1:5000/io');
console.log('Init...');

// settings
let model, webcam, labelContainer, maxPredictions;

let lastPredicts = [];
const PREDICTS_LENGTH = 5;
const REFRESH_RATE = 10;
const SPEED = 20;

// Load the image model and setup the webcam
document.getElementById('start-button').addEventListener('click', async function() {
    const modelURL = url + 'model.json';
    const metadataURL = url + 'metadata.json';

    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmImage.Webcam(212, 212, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    webcam.play();
    window.requestAnimationFrame(loop);

    // append elements to the DOM
    document.getElementById('webcam-container').appendChild(webcam.canvas);
    labelContainer = document.getElementById('label-container');
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild( document.createElement('div') );
    }
});



function cyclePredicts(newest) {
    if(lastPredicts.length < PREDICTS_LENGTH){ lastPredicts.unshift(newest); return; }

    lastPredicts.pop();
    lastPredicts.unshift(newest);
}

// get command key to execute
function getAvgPred(){
    let results = {forward:0, left:0, right:0, back:0, buzz:0, idle:0};

    for (let i = 0; i < lastPredicts.length; i++) {
        for (const { className, probability } of lastPredicts[i]) {
            results[className] += probability;
        }
    }  

    let maxKey = 'idle';
    for (const [key, value] of Object.entries(results)) {
        if (value > results[maxKey])
            maxKey = key;
    }

    return maxKey;
}

// emit command to flask server
function execCommand(command){
    console.log(command);
    switch(command){
        case 'forward':
            move({left:SPEED, right:SPEED });
        break;
        case 'back':
            move({left:-SPEED*0.75, right:-SPEED*0.75 });
        break;
        case 'right':
            move({left:SPEED, right:-SPEED });
        break;
        case 'left':
            move({left:-SPEED, right:SPEED });
        break;
        case 'idle':
            // don't spam with unnecessary requests
            if (lastPredicts[ lastPredicts.length - 1 ] != 'idle')
                move();
        break;  
    }
}

async function handleWebcamData(predicitons){
    cyclePredicts( predicitons );
    const command = getAvgPred();
    execCommand(command);
}

async function loop() {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);

    // await sleep(REFRESH_RATE);
}

// run the webcam image through the image model
async function predict() {
    // predict can take in an image, video or canvas html element
    const prediction = await model.predict(webcam.canvas);

    handleWebcamData(prediction);
}