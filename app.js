import express from "express"
import { Server } from "socket.io";
import http from "http";
import { Chess } from "chess.js";
import path from "path";
import { fileURLToPath } from "url";
import { log } from "console";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const server = http.createServer(app);
const io =  new Server(server);

const chess = new Chess();

let players = {};
let currentplayer = "W";

app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname,"public")))

app.get("/",(req,res)=>{
    res.render("index", {title:"Chess Game"})
})

io.on("connection",function(uniquesocket){
    console.log("connected")

    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole","w")
    }else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole","b")
    }else{
        uniquesocket.emit("SpectatorRole")
    }

    uniquesocket.on("disconnect",function(){
        if(uniquesocket.id === players.white){
            delete players.white;
        }else if(uniquesocket.id === players.black){
            delete players.black;
        }
    })

    uniquesocket.on("move",(move)=>{
        try {
            // playing turn 
            if(chess.turn() === 'w' && uniquesocket.id != players.white)
                return

            if(chess.turn() === 'b' && uniquesocket.id != players.black)
                return

            const result = chess.move(move);
            if(result){
                currentplayer = chess.turn();
                io.emit("move",move);
                io.emit("boardState",chess.fen())
            }else{
                console.log("Invalid move: ",move)
                uniquesocket.emit("invalid move",move)
            }


        } catch (error) {
            console.log(error);
            uniquesocket.emit("invalid move",move)
        }
    })

})

server.listen(3000,function() {
    console.log("Server Listening on port 3000")
})
