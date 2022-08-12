const http = require("http");
const net = require('net');
const fs = require('fs');
const sendAlert = require('./sendAlert');
let rawdata = fs.readFileSync('healthChecks.json');
let healthChecks = JSON.parse(rawdata);

const host = 'localhost';
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
    healthChecks.checks.forEach(checkOption => {
        response = run(checkOption)
        if (!response.ok){
            sendAlert.alert(response, checkOption)
        }
    });
    res.writeHead(200);
    res.end("Health checks completed!");
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {    
    console.log(`Server is running on http://${host}:${port}`);
});

