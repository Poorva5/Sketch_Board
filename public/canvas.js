let canvas = document.querySelector("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket = io.connect("http://localhost:3000");
let mousedown = false;

let pencilColorAll = document.querySelectorAll(".pencil-color");
let pencilWidthElem = document.querySelector(".pencil-width");
let easerWidthElem = document.querySelector(".eraser-width");
let download = document.querySelector(".download")
let redo = document.querySelector(".redo");
let undo = document.querySelector(".undo");

let undoRedoTracker = []; //empty array will track the operations performed
let track = 0; // represnts which action from tracker array

let tool = canvas.getContext("2d");

let pencilColor = "red";
let eraserColor = "white"
let pencilWidth = pencilWidthElem.value;
let eraserWidth = easerWidthElem.value;

tool.strokeStyle = pencilColor;
tool.lineWidth = pencilWidth;

function getCanvasPosition() {
    let rect = canvas.getBoundingClientRect();
    return {
        x: rect.left,
        y: rect.top
    };
}

//mousedown -> start new path, mousemove => path fill (graphins)

canvas.addEventListener("mousedown", (e) => {
    mousedown = true;
    let data = {
        x: e.clientX - getCanvasPosition().x,
        y: e.clientY - getCanvasPosition().y,
    }
    socket.emit("beginPath", data);
    
})

canvas.addEventListener("mousemove", (e) => {
    if (mousedown) {
        let data = {
            x: e.clientX - getCanvasPosition().x,
            y: e.clientY - getCanvasPosition().y,
            color: eraserFlag ? eraserColor : pencilColor,
            width: eraserFlag ? eraserWidth : pencilWidth
        }
        socket.emit("drawStroke", data)
    }
})

canvas.addEventListener("mouseup", (e) => {
    mousedown = false;

    let url = canvas.toDataURL();
    undoRedoTracker.push(url);
    track = undoRedoTracker.length - 1;
})

undo.addEventListener("click", (e) => {
    if (track > 0) track--;
    // track action
    let data = {
        trackValue: track,
        undoRedoTracker
    }
    socket.emit("redoUndo", data);
})
redo.addEventListener("click", (e) => {
    if (track < undoRedoTracker.length-1) track++;
    // track action
    let data = {
        trackValue: track,
        undoRedoTracker
    }
    socket.emit("redoUndo", data);
})

function undoRedoCanvas(trackObj) {
    track = trackObj.trackValue;
    undoRedoTracker = trackObj.undoRedoTracker;

    let url = undoRedoTracker[track];
    let img = new Image(); // new image reference element
    img.src = url;
    img.onload = (e) => {
        tool.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
}

function beginPath(strokeObj) {
    tool.beginPath();
    tool.moveTo(strokeObj.x, strokeObj.y)
}

function drawStroke(strokeObj) {
    tool.strokeStyle = strokeObj.color;
    tool.lineWidth = strokeObj.width;
    tool.lineTo(strokeObj.x, strokeObj.y);
    tool.stroke();
};

pencilColorAll.forEach((colorElem) => {
    colorElem.addEventListener("click", (e) => {
        let color = colorElem.classList[0];
        pencilColor = color;
        tool.strokeStyle = pencilColor;
    })
});

pencilWidthElem.addEventListener("change", (e) => {
    pencilWidth = pencilWidthElem.value;
    tool.lineWidth = pencilWidth
});

easerWidthElem.addEventListener("change", (e) => {
    eraserWidth = easerWidthElem.value;
    tool.lineWidth = eraserWidth;
});

eraser.addEventListener("click", (e) => {
    if (eraserFlag) {
        tool.strokeStyle = eraserColor;
        tool.lineWidth = eraserWidth;
    } else {
        tool.strokeStyle = pencilColor;
        tool.lineWidth = pencilWidth
    }
})


download.addEventListener("click", (e) => {
    let url = canvas.toDataURL();
    let a = document.createElement("a");
    a.href = url;
    a.download = "board.jpg";
    a.click()
})

socket.on("beginPath", (data) => {
    // data -> coming from server
    beginPath(data)
})

socket.on("drawStroke", (data) => {
    drawStroke(data)
})

socket.on("redoUndo", (data) => {
    undoRedoCanvas(data)
})