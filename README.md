# Health check alerter


An nodejs web server that accepts POST requests at /healthCheck and performs health check for the given url and health check configurations passed in the body of the request
If the request fails, the server generates alerts to an subscribed SNS topic to alert the team about the status of the endpoint