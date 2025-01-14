function button() {
  fetch("text.txt")
  .then(function (res) {
    return res.text();
  })
  .then(function (data) {
    //console.log(data);
    alert(data);
  });

}

/* this works no problem on node.js: 
https://replit.com/@jamiehallett1/ViolentUnwillingAlgorithm#index.js
but does it work in html,css,js? */
function button2() {
  const { spawn } = require('child_process');

  const pythonProcess = spawn('python', ['doesthiswork.py']);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python script output: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Error in Python script: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python script process exited with code ${code}`);
  });
}

button2()

//the answer: no