'use strict'

var http = require('http')
var https = require('https')
var fs = require('fs')
var { Server } = require('socket.io')

var express = require('express')
var serveIndex = require('serve-index')

var USERCOUNT = 4

var app = express()
app.use(serveIndex('./public'))
app.use(express.static('./public'))

//http server
var http_server = http.createServer(app)

var io = new Server(http_server)

io.sockets.on('connection', (socket) => {
	socket.on('message', (room, data) => {
		console.log('message, room: ' + room + ', data, type:' + data)
		socket.to(room).emit('message', room, data + 'from server!')
	})

	socket.on('join', (room) => {
		socket.join(room)
		var myRoom = io.sockets.adapter.rooms[room]
		var users = myRoom ? Object.keys(myRoom.sockets).length : 0
		console.log('the user number of room (' + room + ') is: ' + users)

		if (users < USERCOUNT) {
			socket.emit('joined', room, socket.id) //发给除自己之外的房间内的所有人
			if (users > 1) {
				socket.to(room).emit('otherjoin', room, socket.id)
			}
		} else {
			socket.leave(room)
			socket.emit('full', room, socket.id)
		}
	})

	socket.on('leave', (room) => {
		socket.leave(room)

		var myRoom = io.sockets.adapter.rooms[room]
		var users = myRoom ? Object.keys(myRoom.sockets).length : 0
		console.log('the user number of room is: ' + users)

		socket.to(room).emit('bye', room, socket.id)
		socket.emit('leaved', room, socket.id)
	})
})

http_server.listen(8080, '0.0.0.0')
