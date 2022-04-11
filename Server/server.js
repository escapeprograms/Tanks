/*Uses express and socket.io and nodemon --save-dev for convenience
npm start to run
npm run dev to run as dev
*/
//server vars
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
var game = require("./game.js");//get all game classes

const clientPath = __dirname +"/../Client"
console.log("Serving static from "+clientPath);

const app = express();
app.use(express.static(clientPath))

const server = http.createServer(app);
const io = socketio(server);

//game vars
var players = [];
var bullets = [];

//on initial connection
io.on("connection", (socket)=>{
  socket.emit("message","You are connected!");//send to new user only
  console.log("connecting player " + socket.id);

  //player clicks start
  socket.on("start",(obj)=>{
    console.log("player joined " + socket.id, obj.username)
    players.push(new game.Player(socket.id, obj.username, obj.type));
  });

  //check for inputs
  socket.on("input",(obj)=>{
    for (var i = 0; i < players.length; i++){
      if (players[i].id==obj.id){
        players[i].keys = obj.keys;//replace keys data
        break;
      }
    }
    //emergency server shutdown
    if (obj.keys.KeyO&&obj.keys.KeyK) {//emergency shutdown
      console.log("SHUT DOWN SERVER");
      server.close();
      io.close();
    }
  });

  //check for dc
  socket.on("disconnect",()=>{
    //find and delete player
    for (var i = 0; i < players.length; i++){
      if (players[i].id==socket.id){
        console.log("disconnecting player "+socket.id)
        players = players.slice(0,i).concat(players.slice(i+1));//delete player
        break;
      }
  }
  });
});

//Game
var fps = 40;//frames per sec client side
var tps = 40;//tick per sec server side
setInterval(()=>{
  //check all players
  players.forEach((p, index)=>{
    for (var i = 0; i < fps/tps; i++){//loop to match tick per sec with fps
      p.update(players, bullets);
      //shoot
      if (p.shooting){
        bullets.push(new game.Bullet(p.pos[0],p.pos[1],Math.cos(p.angle) * 15,Math.sin(p.angle) * 15,p.color, 100, 30));
        p.shooting = false;//stop shooting
      }
      //death
      if (p.hp <= 0){
        p.id = "";//remove user control
        p.color = "rgb(84, 67, 71)";
        p.hp -= 0.3;//overheat until explosion
        //explode tank
        if (p.hp <= -40) {
          for (var s = 0; s < 12; s++){
            bullets.push(new game.Bullet(p.pos[0],p.pos[1],Math.random()*50-25, Math.random()*50-25,p.color, Math.random()*10+20, 15));//shrapnel explosion
          }
          players = players.slice(0,index).concat(players.slice(index+1));//delete player
        }
      }
    }
  });
  
  //check all bullets
  for (var i = 0; i < bullets.length; i++){
    for (var j = 0; j < fps/tps; j++){
      bullets[i].update();
    }
    if (bullets[i].dur<=0) {
      bullets = bullets.slice(0,i).concat(bullets.slice(i+1));
      i--;
    }
  }
  
  io.emit("ping",[players,bullets]);//send all player data and bullet data
},1000/tps);

//server stuff
server.on("error",(e)=>{
  console.log("Server error: "+ e);
  server.close();
});

server.listen(3000, ()=>{
  console.log("HI, starting server...");
});