const express = require('express')
const dotenv = require('dotenv')
dotenv.config()

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const app = express()
app.use((_req, res) => res.sendFile(INDEX, { root: __dirname }))

const server = app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}...`));

// socket server
const socket = require('socket.io');
const io = socket(server);

let players = []
let turnOrder = 1
let currentPlayer = {}

io.on('connection', (socket) => {
    socket.on('newPlayer', data => {
        console.log("CONNECTED", socket.id)
            data.id = socket.id
            if(players.length < 3){
                players.push(data)
            }
            if (players.length === 1){
                players[0].isMyTurn = true
                currentPlayer = players[0]
            }
            else if (players.length === 2) {
                players[1].name = "Michelle"
                players[1].turnOrder = 2
                players[1].color = 'red'
            }

            else {
                players[2].name = "Greg"
                players[2].turnOrder = 3
                players[2].color = 'green'
            }
            socket.emit('updatePlayers', players, socket.id, currentPlayer)
            socket.broadcast.emit('notifyPlayers', data)
    })

    socket.on('disconnect', function(){
        // const idx = players.findIndex(player => player.id === socket.id)
        // if (idx > -1){
        //     players.splice(idx, 1)
        // }
        // io.emit('updatePlayers', players, socket.id)
    })
    
    socket.on('reqTurn', (grid, player) => {
        players[turnOrder - 1] = player
        if (turnOrder === players.length){turnOrder = 1}
        else turnOrder ++
        currentPlayer = players[turnOrder - 1]
        io.emit('newGrid', grid)
        socket.emit('updatePlayers', players, socket.id, currentPlayer)
        io.emit('newTurn', turnOrder, socket.id, currentPlayer)
    })

    socket.on('create', room => {
        console.log("CREATED", room)
        socket.join(room)
    })

    socket.on('join', room => {``
        socket.join(room)
        io.to(room).emit('opponent_joined')
    })

    socket.on('reqRestart', (data) => {
        const room = JSON.parse(data).room
        io.to(room).emit('restart')
    })
});