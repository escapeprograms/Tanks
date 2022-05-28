/*Uses express and socket.io and nodemon --save-dev for convenience
npm start to run
npm run dev to run as dev
*/
//server vars
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const fs = require("fs");
var game = require("./game.js");//get all game classes
var bot = require("./bots.js");//get ai

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

  //spawn a bot
  socket.on("bot",(obj)=>{
    console.log("spawned bot")
    players.push(new game.Player("bot"+Math.random(), obj.username, obj.type));
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
//get weights from log
var w = [];
var rawdata = fs.readFileSync(__dirname+'/log.txt');
w = JSON.parse(rawdata);
var testBot = new bot.Bot("bot",w);
players.push(new game.Player("bot", "BOT", 3));

//Game
var fps = 40;//frames per sec client side
var tps = 40;//tick per sec server side
setInterval(()=>{
  //check all players
  players.forEach((p, index)=>{
    for (var i = 0; i < fps/tps; i++){//loop to match tick per sec with fps
      //bot AI
      if (p.id.search("bot") != -1) {
        var sightLines = p.calcSightLines(players);
        p.keys = testBot.respond(sightLines);
      }
      p.update(players, bullets);
      //shoot
      if (p.shooting){
        p.guns.forEach((g)=>{
          var angle = g.angle + Math.random()*p.spread-p.spread/2;
          bullets.push(new game.Bullet(p.id, g.pos[0],g.pos[1],Math.cos(angle) * 15, Math.sin(angle) * 15, p.color, 100, p.dmg));
        });
        
        p.shooting = false;//stop shooting
      }
      //death
      if (p.hp <= 0){
        //give kill credit
        if (p.id != "") {
          for (var i = 0; i < players.length; i++){
            if (players[i].id == p.lastHit){
              players[i].kills ++;
              io.emit("kill",{killer:p.lastHit,killed:p.id,dur:100});
              break;
            }
          }
        }
        
        p.id = "";//remove user control
        p.color = "rgb(84, 67, 71)";
        p.hp -= 0.3;//overheat until explosion
        //explode tank
        if (p.hp <= -40) {
          for (var s = 0; s < 12; s++){
            bullets.push(new game.Bullet(p.id, p.pos[0],p.pos[1],Math.random()*50-25, Math.random()*50-25,p.color, Math.random()*10+20, 15));//shrapnel explosion
          }
          players = players.slice(0,index).concat(players.slice(index+1));//delete player
        }

      }
    }
  });
  
  //check all bullets
  for (var i = 0; i < bullets.length; i++){
    var b = bullets[i];
    for (var j = 0; j < fps/tps; j++){
      b.update();
    }
    if (b.dur<=0) {
      if (b.hit){
          //find bullet owner
          for (var p = 0; p < players.length; p++){
            if (b.id == players[p].id)
              io.emit("message",players[p].username+" got a hit")
          }
        }
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