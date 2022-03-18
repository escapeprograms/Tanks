/*Uses express and socket.io and nodemon --save-dev for convenience
npm start to run
npm run dev to run as dev
*/
//server vars
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const clientPath = __dirname +"/../Client"
console.log("Serving static from "+clientPath);

const app = express();
app.use(express.static(clientPath))

const server = http.createServer(app);
const io = socketio(server);
//game vars
//collisions
var playerDimensions = [25,50];
var bulletRadius = 10;

lineLineCross = function(a,b,c,d){
  //line 1: endpoint1 [x,y], endpoint2 [x,y],line 2: endpoint1 [x,y], endpoint2 [x,y]
  var m1 = (b[1]-a[1])/(b[0]-a[0]);
  var m2 = (d[1]-c[1])/(d[0]-c[0]);
  //find intersect point (TRUST THE ALGEBRA)
  var x = (-m2*c[0]+m1*a[0]+c[1]-a[1])/(m1-m2);
  if (b[0]-a[0] === 0){x = a[0];}
  if (c[0]-d[0] === 0){x = c[0];}
  var y = m1*(x-a[0])+a[1];
  if (b[1]-a[1] === 0){y = a[1];}
  if (c[1]-d[1] === 0){y = c[1];}
  var o = [a,b,c,d];
  for (var i = 0; i < 4; i++){
      for (var j = 0; j < 4; j++){
          if (o[i][1]<o[j][1]){
              var temp = o[i];
              o[i] = o[j];
              o[j] = temp;
          }
      }
  }
  if (!y){y= (o[1][1]+o[2][1])/2;}//vertical lines
  if ((x>=a[0]&&x<=b[0]||x>=b[0]&&x<=a[0])&&(x>=c[0]&&x<=d[0]||x>=d[0]&&x<=c[0])&&
  (y>=a[1]&&y<=b[1]||y>=b[1]&&y<=a[1])&&(y>=c[1]&&y<=d[1]||y>=d[1]&&y<=c[1])){
    return [x,y];//return intersection point
  }
  return false;
};
var getAngle = function(val){//tas0kes in 1x2 array
  return Math.atan(val[1]/val[0]);
}

var players = [];
var Player = function(id){
  this.id = id;
  this.keys = {};//list of keys pressed (true=down, false=up)
  this.color = `rgb(
        ${Math.random()*255},
        ${Math.random()*255},
        ${Math.random()*255})`;
  this.pos = [Math.random()*300,Math.random()*300];//x, y
  this.vel = [0,0,0];//vx, vy, vangle
  this.acc = [0,0,0];//ax, ay, aangle
  this.angle = 0;//angle in radians
  this.cooldown = 25;
  
  this.corners = [[0,0],[0,0],[0,0],[0,0]];//4 corners calculated for collisions
  this.intersect = [];
  
  
  this.update = function(){
    //movement keys
    if (this.keys.KeyA) this.vel[2] = -0.07;
    if (this.keys.KeyD) this.vel[2] = 0.07;
    if (this.keys.KeyW) {
      this.vel[0] = Math.cos(this.angle) * 3;
      this.vel[1] = Math.sin(this.angle) * 3;
    }
    //shoot
    if (this.keys.Space){
        this.shoot();
    }
    this.cooldown--;
    //update positions and check collision with tank
    this.pos[0] += this.vel[0];
    this.pos[1] += this.vel[1];
    this.angle += this.vel[2];
    this.calcCorners();
    var ct = this.collideTanks();//use storage var to save cpu
    if (ct.length>0){
      for (var i = 0; i < ct.length; i++){
        var intersect = ct[i][1];//point of collision
        this.intersect = intersect;
        var r1 = Math.sqrt((intersect[0]-this.pos[0])**2 + (intersect[1]-this.pos[1])**2);//distance from center of mass
        var r2 = Math.sqrt((intersect[0]-players[ct[i][0]].pos[0])**2 + (intersect[1]-players[ct[i][0]].pos[1])**2);//distance from center of mass
        var a1 = Math.atan((intersect[1]-this.pos[1])/(intersect[0]-this.pos[0]));//angle from center of mass
        var a2 = Math.atan((intersect[1]-players[ct[i][0]].pos[1])/(intersect[0]-players[ct[i][0]].pos[0]));//angle from center of mass
        //velocity of intersection point
        var v1 = [this.vel[0]-r1*(Math.cos(a1-this.vel[2])-Math.cos(a1)),
                 this.vel[1]-r1*(Math.sin(a1-this.vel[2])-Math.sin(a1))];
        var v2 = [players[ct[i][0]].vel[0]-r2*(Math.cos(a1+players[ct[i][0]].vel[2])-Math.cos(a1)),
                 players[ct[i][0]].vel[1]-r2*(Math.sin(a1+players[ct[i][0]].vel[2])-Math.sin(a1))];
        var totalVel = [v1[0]+v2[0],v1[1]+v2[1]];
        //reset positions
        this.pos[0] -= this.vel[0];
        this.pos[1] -= this.vel[1];
        //players[ct[i][0]].pos[0] -= players[ct[i][0]].vel[0];
        //players[ct[i][0]].pos[1] -= players[ct[i][0]].vel[1];
        //update momentums
        this.vel[0] -= totalVel[0]/2;//slow movement if collide
        this.vel[1] -= totalVel[1]/2;
        players[ct[i][0]].vel[0]+=totalVel[0];
        players[ct[i][0]].vel[1]+=totalVel[1];  
        this.pos[0] += this.vel[0];
        this.pos[1] += this.vel[1];
        
      }
    }
    //constrain speed
    this.vel[0] = Math.min(Math.max(this.vel[0], -5), 5);
    this.vel[1] = Math.min(Math.max(this.vel[1], -5), 5);
    //decellerate
    var acc = 0.9;
    if (this.vel[0] > 0) this.vel[0] *= acc;
    if (this.vel[0] < 0) this.vel[0] *= acc;
    if (this.vel[1] > 0) this.vel[1] *= acc;
    if (this.vel[1] < 0) this.vel[1] *= acc;
    if (this.vel[2] > 0) this.vel[2] *= acc;
    if (this.vel[2] < 0) this.vel[2] *= acc;
    
    //collision logic
    this.collideBullets();
  };
  this.shoot = function(){
    if (this.cooldown<=0){
      bullets.push(new Bullet(this.pos[0],this.pos[1],Math.cos(this.angle) * 15,Math.sin(this.angle) * 15,this.color,100));
      this.cooldown = 25;
      io.emit("message","bullets firing")
    }
  }
  this.calcCorners = function(){
    //update corner positions
    var len = Math.sqrt((playerDimensions[0]/2)**2+(playerDimensions[1]/2)**2);
    var angle2 = Math.atan(playerDimensions[1]/playerDimensions[0]);
    
    this.corners[0] = [this.pos[0]+(Math.cos(this.angle-angle2) * len), this.pos[1]+(Math.sin(this.angle-angle2) * len)];
    this.corners[1] = [this.pos[0]+(Math.cos(this.angle+angle2) * len), this.pos[1]+(Math.sin(this.angle+angle2) * len)];
    this.corners[2] = [this.pos[0]+(Math.cos(Math.PI+this.angle-angle2) * len), this.pos[1]+(Math.sin(Math.PI+this.angle-angle2) * len)];
    this.corners[3] = [this.pos[0]+(Math.cos(Math.PI+this.angle+angle2) * len), this.pos[1]+(Math.sin(Math.PI+this.angle+angle2) * len)];
  }
  
  this.collideBullets = function(){
    for (var i = 0; i < bullets.length; i++){
      var b = bullets[i];
      //skip bullets of same color
      if (b.color == this.color) continue;
      
      //draw an imaginary path of the bullet and check if it crosses any lines within the tank
      var b1 = b.pos;//current bullet position
      var b2 = [b.pos[0]-2*b.vel[0],b.pos[1]-2*b.vel[1]];//past position
      if (//check if the line crosses into the tank
        lineLineCross(b1,b2,this.corners[0],this.corners[1])||
        lineLineCross(b1,b2,this.corners[1],this.corners[2])||
        lineLineCross(b1,b2,this.corners[2],this.corners[3])||
        lineLineCross(b1,b2,this.corners[3],this.corners[0])
        ){
        io.emit("message","collision")
        bullets[i].dur = 0;//destroy bullet
      }
    }
  }
  this.collideTanks = function(){
    var colliding = [];
    for (var i = 0; i < players.length; i++){
      var p = players[i];
      //skip player of same color
      if (p.color == this.color) continue;
      
      //check if any boundary line of the two tanks cross
      edges:for (var c = 0; c < 4; c++){
        for (var d = 0; d < 4; d++){
          var intersect = lineLineCross(p.corners[c],p.corners[(c+1)%4],       
              this.corners[d],this.corners[(d+1)%4]);
          if (intersect){
            //return # for offending tank, intersection point
            colliding.push([i,intersect]);
            break edges;//only allow 1 collision between 2 specific tanks
            //return true;
          }
        }
      }
    }
    return colliding;//return a list of every colliding tank
  }
}

var bullets = [];
var Bullet = function(x, y, dx, dy, color, duration){
  this.pos = [x, y];//x,y
  this.vel = [dx, dy];
  this.color = color;
  this.dur = duration;
  this.update = function(){
    this.pos[0]+=this.vel[0];
    this.pos[1]+=this.vel[1];
    this.dur--;
  };
}

//on initial connection
io.on("connection", (socket)=>{
  socket.emit("message","You are connected!");//send to new user only
  console.log("connecting player "+socket.id)
  players.push(new Player(socket.id));

  //check for inputs
  socket.on("input",(obj)=>{
    for (var i = 0; i < players.length; i++){
      if (players[i].id==obj.id){
        players[i].keys = obj.keys;//replace keys data
        break;
      }
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
  players.forEach((p)=>{
    for (var i = 0; i < fps/tps; i++){
      p.update();
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
  console.log("error bye: "+ e);
});

server.listen(3000, ()=>{
  console.log("HI, starting server...");
});