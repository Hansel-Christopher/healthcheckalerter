const { verify } = require('crypto');
const express = require('express')
const app = express();
const net = require('net');
const sendAlert = require('./sendAlert');

app.use(express.json()) 
const port = 8000;

const run = function(healthCheckOptions) {
    
    const socket = net.connect(healthCheckOptions.port, healthCheckOptions.hostname);

    let response = {};

    const timer = setTimeout(() => {
        socket.destroy();
        response.ok = false;
        response.result = '[503] Gateway error';
        response.checkedAt = new Date();
        console.error(`Health check "${healthCheckOptions.name}" failed: ${response.result}`);    
    }, healthCheckOptions.timeout);


    socket.on('connect', () => {
        clearTimeout(timer);
        socket.destroy();
        response.ok = true;
        response.result = '[200] OK';
        response.checkedAt = new Date();
        console.log(`Health check "${healthCheckOptions.name}" succeeded: ${response.result}`)        
    });

    socket.on('error', error => {
        clearTimeout(timer);
        socket.destroy();
        response.ok = false;
        response.result = error.message;
        response.checkedAt = new Date();
        console.error(`Health check "${healthCheckOptions.name}" failed: ${error.message}`);        
    });
    
    return response;
};

const requestListener = function (req, res) {
    const checkOptions = req.body;
    response = run(checkOptions)
    
    if (!response.ok){
        sendAlert.alert(response, checkOptions)
    }    

    res.send("Health checks completed!");
};

app.listen(port)

app.post('/healthCheck', requestListener)