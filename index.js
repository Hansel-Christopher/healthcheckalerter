const express = require('express')
const app = express();
const axios = require('axios');
const sendAlert = require('./sendAlert');

app.use(express.json()) 
const hostname = "localhost"
const port = 8000;

const runChecks = function(healthCheckOptions) {       
    return axios({
        url: healthCheckOptions.url,
        method: healthCheckOptions.method || 'HEAD',
        headers: healthCheckOptions.headers || {},
        timeout: healthCheckOptions.timeout
    })    

};

const requestListener = function (req, res) {
    const checkOptions = req.body;    
    let response = {};
    runChecks(checkOptions).then(() => {
        response.ok = true;
        response.checkOutput = '';
        response.checkedAt = new Date();        
        res.send(`[200] Successful`);
    })
    .catch(error => {
        response.ok = false;
        response.checkOutput = error.message;
        response.checkedAt = new Date();        
        console.error(`Health check "${checkOptions.name}" failed: ${error.message}`);
        res.send(`${error.message}`)
        return response;
    }).finally(() => {        
        if(!response.ok)
            sendAlert.alert(response, checkOptions)
    })
    
};

app.listen(port, () => {
    console.log(`Health check service running on http://${hostname}:${port}`);
})

app.post('/healthCheck', requestListener)