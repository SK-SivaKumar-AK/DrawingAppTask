
const WebSocket = require('ws');
const express = require('express');


const app = express();
const http = require('http').Server(app);
const wss = new WebSocket.Server({ server: http });


let clients = [];
let drawingHistory = [];



function broadcast(message) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}




wss.on('connection', (ws) => {

    const userID =  Math.floor(Math.random() * 9000) + 1000;
    ws.userID = userID;


    clients.push(ws);
    const clientCount = clients.length;


    drawingHistory.forEach((event) => {
        ws.send(JSON.stringify(event));
    });
    

    broadcast({ type: 'user-connected', message: `User ID: ${userID} has joined!`, clientCount: `Total Connected Users: ${clientCount}` });

    ws.on('message', (message) => {

        const data = JSON.parse(message);

        if (data.type === 'drawing') {

            drawingHistory.push(data);
            broadcast({ type: 'drawing', data: data.data });

        } else if (data.type === 'reset') {

            drawingHistory = [];
            broadcast({ type: 'reset' });

        }
    });


    ws.on('close', () => {

        clients = clients.filter(client => client !== ws);
        const clientCount = clients.length;
        
        broadcast({ type: 'user-disconnected', message: `User ID: ${ws.userID} has disonnected!`, clientCount: `Total Connected Users: ${clientCount}` });

    });

});


app.use(express.static('public'));


http.listen(8080, () => {
    console.log('Server is running on ws://localhost:8080');
});

