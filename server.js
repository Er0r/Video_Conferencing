/*
Inside this Server, there is a simple integration code of socket.io

*/
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const users = {};




io.on('connection', socket => { // handle the event send with socket.send() from client side, Those are simple work handling post requests. You know those things better than me Sir
    if (!users[socket.id]) {
        users[socket.id] = socket.id;
    }
    socket.emit("yourID", socket.id); // Just sent some custom id
    io.sockets.emit("allUsers", users); 
    socket.on('disconnect', () => { // 3 functions (disconnect, call and accept). those are the core part of socket.io
        delete users[socket.id];
    })

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit('hey', {signal: data.signalData, from: data.from});
    })

    socket.on("acceptCall", (data) => {
        io.to(data.to).emit('callAccepted', data.signal);
    })
});

server.listen(8000, () => console.log('server is running on port 8000')); // Server is up on localhost port 8000. You can change this with your own server port Sir


