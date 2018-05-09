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
    let token = socket.handshake.query && socket.handshake.query.accessToken;
    if(!token){
        next(new Error('Authentication error'));
    }
    var options = {
        uri: `${process.env.REST_CLIENT}me`,
        headers: {
            'User-Agent': 'Request-Promise',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        rejectUnauthorized: false,
        json: true // Automatically parses the JSON string in the response
    };
    rp(options)
        .then((res) => {
            socket.user = res;
            next();
        })
        .catch((err) => {
            console.log('Handshake query rejected', err);
            next(new Error(err));
        });
});

io.sockets.on('connection', (socket) => {
    var collections = socket.user.collection_ids;
    console.log(socket.user.id);
    // collections = collections.map((val) => val.id);
    socket.join(`user::${socket.user.id}`);
    if(socket.user){
        // Join to room named collection::Id
        collections.forEach((val) => {
            socket.join(`collection::${val}`);
        });

    }
    socket.on('disconnect', (data) => {
        // disconnected from rooms named collection::Id
        collections.forEach((val) => {
            console.log(`leaving collection::${val}`)
            socket.leave(`collection::${val}`);
        });
        socket.leave(`user::${socket.user.id}`);

    })
});
