logger = require('./app/logger.js');
const express = require('express');
const http = require('http');
const redis = require('redis');
const app = express();
require('dotenv').config();

url = require('url');

app.get('/', function(req,res) {
  res.sendfile('public/index.html');
});

redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);
redisClient.on('connect', function() {
	console.log('Redis is listening on port ' + process.env.REDIS_PORT);
});

io = require('socket.io').listen(app.listen(process.env.SERVER_PORT));
console.log('Server is Listening on %d', process.env.SERVER_PORT);

const SwatchbookApp = require('./app/main');

module.exports = SwatchbookApp;
