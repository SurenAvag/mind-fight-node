var	rp = require('request-promise');
redisClient.subscribe('game-created');

let onlineUsers = [];

redisClient.on("message", function(channel, data) {
	var dataJson = JSON.parse(data);
	if(dataJson && dataJson.data){
		switch(channel){
            case 'game-created': gameCreated(dataJson.data); break;
		}
	}
});

function gameCreated(data)
{
    let user = onlineUsers.find(val => val.id === data.user.id);
    if(!user){
        return;
    }

    io.sockets.connected[user.socketId].join(`game::${data.game.id}`);
}

io.use(function(socket, next) {
    let token = socket.handshake.query && socket.handshake.query.accessToken;
    if(!token){
        next(new Error('Authentication error'));
    }
    var options = {
        uri: `${process.env.REST_CLIENT}me?api_token=${token}`,
        headers: {
            'User-Agent': 'Request-Promise',
            'Accept': 'application/json',
        },
        rejectUnauthorized: false,
        json: true // Automatically parses the JSON string in the response
    };
    rp(options)
        .then((res) => {
            socket.user = res;
            socket.user.socketId = socket.id;
            next();
        })
        .catch((err) => {
            console.log('Handshake query rejected');
            next(new Error(err));
        });
});

io.sockets.on('connection', (socket) => {
    // collections = collections.map((val) => val.id);
    socket.join(`user::online`);

    onlineUsers.push(socket.user);

    io.sockets.in(`user::online`).emit('online-user-list-changed', onlineUsers);

    socket.on('disconnect', (data) => {
        socket.leave(`user::online`);
        let userIndex = onlineUsers.findIndex(val => val.id === socket.user.id);
        if(userIndex !== -1){
            onlineUsers.splice(userIndex, 1);
        }
        io.sockets.in(`user::online`).emit('online-user-list-changed', onlineUsers);

    })
});
