
const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSqaure = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board()
    boardElement.innerHTML = "";
    
    board.forEach((row , rowindex) => {
        row.forEach((square , squareindex) =>{
            const squareElement = document.createElement("div");
            squareElement.classList.add("square",
                (rowindex + squareindex) % 2 === 0 ? "light":"dark"
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if(square){
                const pieceElement = document.createElement("div")
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );

                pieceElement.innerText = getPieceUnicode(square) ; // getting throw getPieceUnicode
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if(pieceElement.draggable){
                        draggedPiece = pieceElement;
                        sourceSqaure = { 
                            row:rowindex, col:squareindex
                        }
                        e.dataTransfer.setData("text/plain","")
                    }
                })

                pieceElement.addEventListener("dragend",(e) => {
                    draggedPiece = null;
                    sourceSqaure = null; 
                })

                squareElement.appendChild(pieceElement)
            }

            squareElement.addEventListener("dragover",function (e){
                e.preventDefault();
            })

            squareElement.addEventListener("drop", function(e){
                e.preventDefault();

                if(draggedPiece){
                    const targetSource = {
                        row : parseInt(squareElement.dataset.row),
                        col : parseInt(squareElement.dataset.col),
                    }

                    handleMove(sourceSqaure,targetSource)
                }
            })
            boardElement.appendChild(squareElement)
        })
        
    }); 

    if(playerRole === "b"){
        boardElement.classList.add("flipped")
    }else{
        boardElement.classList.remove("flipped")
    }
}

const handleMove = (source, target) => {
    const files = ["a","b","c","d","e","f","g","h"];

    const from = files[source.col] + (8 - source.row);
    const to   = files[target.col] + (8 - target.row);

    const move = chess.move({ from, to });

    if (move) {
        socket.emit("move", { from, to }); 
        renderBoard(); // re-render after valid move
    } else {
        console.log("Invalid move");
    }
};


const getPieceUnicode = (piece) => {
    const chessUnicode = {
        w: {
        p: "♙",
        r: "♖",
        n: "♘",
        b: "♗",
        q: "♕",
        k: "♔",
        },
        b: {
        p: "♟",
        r: "♜",
        n: "♞",
        b: "♝",
        q: "♛",
        k: "♚",
        },
    };
    return chessUnicode[piece.color]?.[piece.type] || "";
}

socket.on("playerRole", function(role) {
    playerRole = role; // "w" or "b"
    renderBoard();     // re-render to update draggable pieces
});

socket.on("SpectatorRole", function(){
    playerRole = null;
    renderBoard();
})

socket.on("boardState", function(fen){
    chess.load(fen);
    renderBoard();
})

socket.on("move",function(move){
    chess.move(move)
    renderBoard();
})

renderBoard();

