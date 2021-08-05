// More API functions here:
            // https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image
        
            // the link to your model provided by Teachable Machine export panel
            const url = './';
        
            let model, webcam, labelContainer, maxPredictions;
        
            // Load the image model and setup the webcam
            async function init() {
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
                    labelContainer.appendChild(   document.createElement('div') );
                }
            }

            let lastPredicts = [];
            const PREDICTS_LENGTH = 10;

            function cyclePredicts(newest) {
                if(lastPredicts.length < PREDICTS_LENGTH){ return; }
                lastPredicts.pop();
                lastPredicts.unshift(newest);
            }

            /**
             * ORDER
             * forward: 0.000009464644790568855 
                left stationary: 0.06639455258846283 
                right stationary: 0.9242545962333679
                back: 0.0009091228130273521 
                buzz: 0.00004546275522443466 
                idle: 0.008386743254959583
             * 
             * 
             * */

            function getAvgPred(){
                
            }

            async function handleWebcamData(predicitons){
                // console.log(`${key}: ${pred}`);

                console.log(predictions);

                // pred is a float
                cyclePredicts(  );



            }
        
            async function loop() {
                webcam.update(); // update the webcam frame
                await predict();
                window.requestAnimationFrame(loop);
            }
        
            // run the webcam image through the image model
            async function predict() {
                // predict can take in an image, video or canvas html element
                const prediction = await model.predict(webcam.canvas);
                console.log('---');

                handleWebcamData(prediction);

            }