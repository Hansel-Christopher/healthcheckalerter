const express = require('express')
const app = express();
const axios = require('axios');
const sendAlert = require('./sendAlert');

const cron = require("node-cron");
const fs = require('fs');
const jobMap = {};

const path = process.env.HEALTHCHECK_FILESTORE || "./healthchecks.json";

app.use(express.json()) 
const hostname = "localhost"
const port = 8000;

const setupFileStore = function(path){
    if (!fs.existsSync(path)) {
        throw "File does not exist"
    }else{
        try {            
            let rawdata = fs.readFileSync(path);
            return JSON.parse(rawdata);
        } catch (e) {            
            var jobs = { jobs: [] };  
            var json = JSON.stringify(jobs);
            fs.writeFileSync(path, json, 'utf8', (err) => {
                if (err)
                console.log(err);
            });
            return jobs;
        }
    }   
}


const setupCronJob = function(job){    
    let frequency = job.frequency || '* * * * *';    
    cron.validate(frequency)
    const task = cron.schedule(frequency, function() {        
        runChecks(job);
    }); 
    jobMap[job.name] = task;
}

const viewHealthChecks = function(req, res){
    let rawdata = fs.readFileSync(path);
    res.send(JSON.parse(rawdata));
}

const runChecks = function(job) {     
    let response = {};      
    axios({
        url: job.healthChecks.url,
        method: job.healthChecks.method || 'HEAD',
        headers: job.healthChecks.headers || {},
        timeout: job.healthChecks.timeout
    }).then(() => {
        response.ok = true;
        response.checkOutput = '200';
        response.checkedAt = new Date();                
    })
    .catch(error => {
        response.ok = false;
        response.checkOutput = error.message;
        response.checkedAt = new Date();        
        console.error(`Health check "${job.name}" failed: ${error.message}`);        
        return response;
    }).finally(() => {        
        sendAlert.alert(response, job)            
    })

};

const writeToFile = function(filename, newData){            
    fs.writeFileSync(filename, newData, 'utf8', (err) => {
        if (err)
        console.log(err);
    });    
}

const registerHealthCheck = function (req, res) {
    const job = req.body;        
    try{
        setupCronJob(job);  
        let data = fs.readFileSync(path);
        obj = JSON.parse(data);
        obj.jobs.push(job);
        json = JSON.stringify(obj); 
        writeToFile(path, json)     
        res.send(`Health check setup successful for: ${job.name}`)
    }catch(e) {
        res.send(`Health check setup failed for: ${job.name}, ERR: ${e}`)
    }
    
};

const removeHealthCheck = function (req, res) {
    let data = fs.readFileSync(path);
    let obj = JSON.parse(data);
    let name = req.body.name;
    if(name){
        let job = jobMap[name]
        if(job == null){
            res.send(`No health check configured for: ${name}`)
        }else{            
            job.stop();                    
            let jobs = obj.jobs;
            var newJobs = jobs.filter(function (el) {
                return el.name != name 
            });
            
            obj.jobs = newJobs;
            json = JSON.stringify(obj); 
            writeToFile(path, json) 
            res.send(`Removed: ${name}`)
        }        
    }else{
        res.send("job name required")
    }
}

app.listen(port, () => {    
    let healthChecks = setupFileStore(path);
    healthChecks.jobs.forEach(job => {
        setupCronJob(job) 
    });
    console.log(`Health check service running on http://${hostname}:${port}`);
})

app.post('/healthCheck', registerHealthCheck)
app.get('/view', viewHealthChecks)
app.post('/remove', removeHealthCheck)