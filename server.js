let express = require('express'),
    app = express(),
    httpServer = require('http').createServer(app),
    io = require('socket.io')(httpServer, {cors: {origin: '*'}}),
    PORT = 80,
    cache = {};
app.use(express.static('public'))

app.get('/', function(request, response) {
    response.sendFile('public/index.html', {root: __dirname})
})

io.on("connection", socket => {
    let roomId = socket.handshake.auth.roomId;
    if(roomId == null) {
        roomId = "public"+socket.id;
    }
    socket.join(roomId);
    if(cache[roomId] == null) {
        cache[roomId] = {drawings: []};
    }
    //console.log(socket.rooms)
    socket.emit("roomId", roomId); //Send room Id to the connected client

    socket.emit("replaceDrawings", cache[roomId].drawings); //send current state of drawings to client

    socket.on("pushCurrentDrawing", (currentDrawing) => {
        cache[roomId].drawings.push(currentDrawing); //Save pushed current drawing to drawings
        socket.to(roomId).emit("newCurrentDrawing", currentDrawing); //send new currentDrawing to everyone in the room
    })

    socket.on("deleteWithId", (ID) => {
        for(let i = cache[roomId].drawings.length-1; i >= 0; --i) {
            if(cache[roomId].drawings[i].id === ID) {
                cache[roomId].drawings.splice(i,1);
                socket.to(roomId).emit("deleteWithId", ID);
                break;
            }
        }
    })

    socket.on("deleteWithCreatedById", drawingIds => {
        IDs = new Set(drawingIds);
        for(let i = cache[roomId].drawings.length-1; i >= 0; --i) {
            if(IDs.has(cache[roomId].drawings.createdBy)) {
                cache[roomId].drawings.splice(i,1);
            }
        }
        socket.to(roomId).emit("deleteWithCreatedById", drawingIds);
    })
})

httpServer.listen(PORT, () => console.log(`Started server at ${PORT}`))