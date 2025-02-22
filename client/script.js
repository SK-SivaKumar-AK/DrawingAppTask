
const socket = new WebSocket(
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'ws://localhost:8080' : 'wss://drawingapptaskserver.onrender.com'
);


const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');


const clientCountDiv = document.getElementById('clientCount');
const clientIDDiv = document.getElementById('clientID');


let drawing = false;
let prevX = 0;
let prevY = 0;
let brushSize = 2;
let brushColor = '#000000';

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

socket.onopen = () => {
    console.log('Connected to the server');
};


socket.onmessage = (event) => {

    const message = JSON.parse(event.data);

    if (message.type === 'drawing') {
        drawOnCanvas(message.data);
    } else if (message.type === 'reset') {
        resetCanvas();
    } else if (message.type === 'user-connected') {
        console.log(message.message);
        clientIDDiv.textContent = message.message;
        clientCountDiv.textContent = message.clientCount;
    } else if (message.type === 'user-disconnected') {
        console.log(message.message);
        clientIDDiv.textContent = message.message;
        clientCountDiv.textContent = message.clientCount;
    }

};



function getPosition(e) {

    let x, y;
    
    if (e.type.startsWith('touch')) {
        const touch = e.touches[0] || e.changedTouches[0];
        
        const rect = canvas.getBoundingClientRect();
        
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        x = (touch.clientX - rect.left) * scaleX;
        y = (touch.clientY - rect.top) * scaleY;
    } else {
        x = e.offsetX;
        y = e.offsetY;
    }
    
    return { x, y };
    
}



function startDrawing(e) {

    const { x, y } = getPosition(e);
    drawing = true;
    prevX = x;
    prevY = y;
    
}


function draw(e) {

    if (!drawing) return;

    const { x, y } = getPosition(e);
    const drawingData = {
        startX: prevX,
        startY: prevY,
        endX: x,
        endY: y,
        brushSize: brushSize,
        brushColor: brushColor,
    };

    socket.send(JSON.stringify({ type: 'drawing', data: drawingData }));
    drawOnCanvas(drawingData);

    prevX = x;
    prevY = y;

}


function stopDrawing() {

    drawing = false;

}




canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);




canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startDrawing(e);
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
});
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);



function drawOnCanvas(data) {

    ctx.beginPath();
    ctx.moveTo(data.startX, data.startY);
    ctx.lineTo(data.endX, data.endY);
    ctx.strokeStyle = data.brushColor;
    ctx.lineWidth = data.brushSize;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

}



document.getElementById('resetBtn').addEventListener('click', () => {

    socket.send(JSON.stringify({ type: 'reset' }));
    resetCanvas();

});



function resetCanvas() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

}

document.getElementById('color-picker').addEventListener('input', (e) => {

    brushColor = e.target.value;

});

document.getElementById('brush-size').addEventListener('input', (e) => {

    brushSize = e.target.value;

});

