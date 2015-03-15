# Throttling-API-client
The throttling client consists of two components:
- api.js: the endpoint, which handles the http requests, and
- throttle.js: the throttling component - and core of this exercise

Besides, I created dummyserver.js which runs a very simple server at localhost:8080. That way, one can test the endpoint without having access to the actual Facebook graph API.

I created tests for both api.js and throttle.js, which can be run with Mocha ($ mocha test).

I did not try to make anything robust against misuse, because throttling was the point of this exercise.
