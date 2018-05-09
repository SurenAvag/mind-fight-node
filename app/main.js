var	rp = require('request-promise');

redisClient.subscribe('collection-created');
redisClient.subscribe('collection-updated');
redisClient.subscribe('collection-deleted');

redisClient.on("message", function(channel, data) {
	var dataJson = JSON.parse(data);
	if(dataJson && dataJson.data){
		if(channel === 'collection-created') {
		}
		if(channel === 'collection-updated') {
		}
		if(channel === 'collection-deleted') {
		}
	}
});

io.use(function(socket, next) {
	return next();
	// next(new Error('Authentication error'));
});

io.sockets.on('connection', function (socket) {
});
