var	rp = require('request-promise');
redisClient.subscribe('users-attached-to-game');
redisClient.subscribe('game-deleted');
redisClient.subscribe('game-started');

let onlineUsers = [];

redisClient.on("message", function(channel, data) {
	var dataJson = JSON.parse(data);
	if(dataJson && dataJson.data){
		switch(channel){
            case 'users-attached-to-game': usersAttachedToGame(dataJson.data); break;
            case 'game-deleted': gameDeleted(dataJson.data); break;
            case 'game-started': gameStarted(dataJson.data); break;
		}
	}
});

function gameStarted(data) {
    io.sockets.in(`game::${data.game.id}`).emit('game-started', data);
}

function gameDeleted(data) {
    io.sockets.in(`game::${data.game.id}`).emit('game-deleted', data);
}

function usersAttachedToGame(data)
{
    let user = onlineUsers.find(val => val.id === data.user.id);
    let invitedUser = onlineUsers.find(val => val.id === data.invitedUser.id);

    if(user && io.sockets.connected[user.socketId]) {
        io.sockets.connected[user.socketId].join(`game::${data.game.id}`);
        user.games.push(data.game);
    }

    if(invitedUser && io.sockets.connected[invitedUser.socketId]) {
        io.sockets.connected[invitedUser.socketId].join(`game::${data.game.id}`);
        io.sockets.connected[invitedUser.socketId].emit('game-invitation', data);
        invitedUser.games.push(data.game);
    }
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
            socket.user.games = [];
            socket.user.socketId = socket.id;
            next();
        })
        .catch((err) => {
            console.log('Handshake query rejected');
            next(new Error(err));
        });
});

function disconnected(user) {
    var options = {
        uri: `${process.env.REST_CLIENT}me/disconnected?api_token=${user.apiToken}`,
        headers: {
            'User-Agent': 'Request-Promise',
            'Accept': 'application/json',
        },
        rejectUnauthorized: false,
        json: true // Automatically parses the JSON string in the response
    };
    rp(options)
        .then((res) => {
            console.log(res);
        })
        .catch((err) => {
            console.log('disconnect rejected');
        });
}

io.sockets.on('connection', (socket) => {
    // collections = collections.map((val) => val.id);
    socket.join(`user::online`);

    onlineUsers.push(socket.user);

    io.sockets.in(`user::online`).emit('online-user-list-changed', onlineUsers);

    socket.on('disconnect', (data) => {
        socket.leave(`user::online`);
        let userIndex = onlineUsers.findIndex(val => val.id === socket.user.id);
        if(userIndex !== -1){
            disconnected(onlineUsers[userIndex]);
            onlineUsers.splice(userIndex, 1);
        }
        io.sockets.in(`user::online`).emit('online-user-list-changed', onlineUsers);

    })
});
