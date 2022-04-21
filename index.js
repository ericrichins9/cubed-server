const express = require('express')
const dotenv = require('dotenv')
dotenv.config()

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const app = express()
app.use((_req, res) => res.sendFile(INDEX, { root: __dirname }))

const server = app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}...`));

const socket = require('socket.io');
const io = socket(server);

let rooms = {}

io.on('connection', socket => {
    socket.on('disconnect', function(){
        //delete rooms[room[socket.id]]
        //io.emit('updatePlayers', rooms[room], socket.id)
    })
    
    socket.on('reqTurn', (grid, player, room) => {
        let currentTurn
        {room.turnOrder === room.players.length ? currentTurn = 1 : currentTurn = room.turnOrder + 1}
        io.to(room.id).emit('newGrid', grid)
        io.to(room.id).emit('newTurn', currentTurn, room)
    })
    socket.on('createRoom', (room)  => {
        const roomId = room
        rooms[roomId] = {...rooms[roomId], id: roomId, turnOrder: 1, gameStart: false, players: []}
        socket.join(room)
    })
    socket.on('join', room => {
        socket.join(room)
    })
    socket.on("updateRoom", (room, name, color, isMyTurn, pieces) => {
        const id = socket.id
        const player = {id, name, color, isMyTurn, pieces}
        const currentRoom = rooms[room]
        currentRoom.players = [...currentRoom.players, player]
        io.to(room).emit('updatePlayers', rooms[room])
    })
    socket.on("startGame", (room) => {
        rooms[room].gameStart = true
        io.to(room).emit('gameStart', rooms[room])
    })
    socket.on('reqRestart', (data) => {
        const room = JSON.parse(data).room
        io.to(room).emit('restart')
    })
});