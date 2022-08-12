var AWS = require('aws-sdk');

AWS.config.update({region: 'us-west-2'});

publishToSns = function(response, checkOption) {

    let status = response.ok ? "HEALTHY" : "UNHEALTHY"
    var params = {
        Message: `Check: ${checkOption.name}; Endpoint: ${checkOption.hostname}; Status: ${status}; BusinessImpact: ${checkOption.businessImpact}`,
        TopicArn: 'arn:aws:sns:us-west-2:609850474485:sample-alerting'
    };


    var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

    // Handle promise's fulfilled/rejected states
    publishTextPromise.then(
    function(data) {
        console.log(`Message ${params.Message} sent to the topic ${params.TopicArn}`);        
    }).catch(
        function(err) {
        console.error(err, err.stack);
    });
    
}

log = function(param){
    console.log(param)
}

module.exports.alert = publishToSns;