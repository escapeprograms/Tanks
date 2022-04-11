const socket = io();//from server.js

/*area displayed
0: home screen
1: gameplay

*/
var area = 0;
//switch to page n
function page(n) {
  area = n;
  document.getElementsByClassName("home")[0].style = "display:none;";
  document.getElementsByClassName("game")[0].style = "display:none;";
  if (n == 0){
    document.getElementsByClassName("home")[0].style = "display:inline;";
  }
  if (n == 1){
    document.getElementsByClassName("game")[0].style = "display:inline;";
    document.getElementsByClassName("game")[0].style.opacity = 1;
  }
}

var tankType = 0;
//start game
function enterGame(e) {
  var username = document.getElementById("username").value;
  socket.emit("start",{username:username,type:tankType});
  page(1);
}
document.getElementById("username").addEventListener("keypress", (e) =>{
  if (e.code=="Enter") enterGame(e);
});
document.getElementById("enter").addEventListener("click", enterGame);

//choose tank type
//draw tank
function drawTank(ctx, p, off){//takes in context, Player p, and offset [x,y]
  ctx.fillStyle = p.color;
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  //draw tank
  ctx.beginPath();
  ctx.moveTo(p.corners[0][0]+off[0], p.corners[0][1]+off[1]); 
  for (var i = 1; i < p.corners.length; i++){
    ctx.lineTo(p.corners[i][0]+off[0], p.corners[i][1]+off[1]);
  }
  ctx.lineTo(p.corners[0][0]+off[0], p.corners[0][1]+off[1]);
  ctx.stroke();
  ctx.fill();
  //tank decorations
  switch (p.type) {
    case 0://standard tank
      ctx.translate(p.pos[0]+off[0],p.pos[1]+off[1]);
      ctx.rotate(p.angle);
      //draw barrel
      ctx.strokeRect(0,-10,25,20);
      ctx.fillRect(0,-10,25,20);
      ctx.resetTransform();
      break;
    case 1:
      ctx.translate(p.pos[0]+off[0],p.pos[1]+off[1]);
      ctx.rotate(p.angle);
      //draw barrel
      ctx.strokeRect(-5,-7,25,14);
      ctx.fillRect(-5,-7,25,14);
      ctx.resetTransform();
      break;
    case 2:
      ctx.translate(p.pos[0]+off[0],p.pos[1]+off[1]);
      ctx.rotate(p.angle);
      //draw barrel
      ctx.strokeRect(-5,-15,30,30);
      ctx.fillRect(-5,-15,30,30);
      ctx.resetTransform();
      break;
    default:
      break;
  }
}

//tank type info (copied from game.js)
var tankTypes = [
  {
    name:"Standard",
    hp:100,
    dmg:30,
    acc:1,
    maxVel:5,
    cooldown:25,
    vertices:[[-12,-25],[12,-25],[12,25],[-12,25]],
  },
  {
    name:"Zoomer",
    hp:70,
    dmg:20,
    acc:2,
    maxVel:8,
    cooldown:15,
    vertices:[[-12,-20],[30,0],[-12,20]],
  },
  {
    name:"Artillery",
    hp:120,
    dmg:80,
    acc:1,
    maxVel:1,
    cooldown:50,
    vertices:[[-25,-25],[12,-30],[18,0],[12,30],[-25,25]],
  },
];
function switchTank(n) {
  if (n < 0) n = 0;
  if (n >= tankTypes.length) n = tankTypes.length-1;
  var ctx = document.getElementById("preview").getContext('2d');
  ctx.canvas.width = 100;
  ctx.canvas.height = 100;
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  var preview = {
    pos:[0,0],
    color:`rgb(
        ${Math.random()*255},
        ${Math.random()*255},
        ${Math.random()*255})`,
    angle:0,
    type:n,
    corners:tankTypes[n].vertices
  };
  drawTank(ctx, preview, [50,50]);
  tankType = n;
}
switchTank(0);//default 0
document.getElementById("left-preview").addEventListener("click", ()=>{
  switchTank(tankType-1);});
document.getElementById("right-preview").addEventListener("click", ()=>{
  switchTank(tankType+1);});


//update keys pressed
var keys = {};
function addKey(e) {
  if (area != 1) return;//only activate in game
  if(e) {
    keys[e.code] = true;
  }
  socket.emit("input",{id:socket.id,keys:keys});//send id and keys down
}
function removeKey(e) {
  if (area != 1) return;//only activate in game
  if(e) {
    //search and delete key from keys 
    keys[e.code] = false;
  }
  socket.emit("input",{id:socket.id,keys:keys});//send id and keys down
}

//receive player data
var players = [];
var bullets = [];
socket.on("ping",(data)=>{
  players = data[0];
  bullets = data[1];
});

//update log
socket.on("message", (text)=>{
  document.getElementById("log").innerHTML=text;
  console.log("log" + text);
});

//canvas and display
var fps = 40;
var ctx = document.getElementById('canvas').getContext('2d')
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
var cam = [0,0];

//smoke effects
var particles = [];

var Particle = function(x, y, dx, dy, color, duration, size) {
  this.pos = [x,y];
  this.vel = [dx,dy];
  this.color = color;
  this.dur = duration;
  this.size = size;

  this.update = function(){
    this.pos[0] += this.vel[0];
    this.pos[1] += this.vel[1];
    this.dur --;
  }
}

//UI vars
var hpLen = 0;

//Loop
setInterval(()=>{
  //move camera to your player
  var alive = false;
  for (var i = 0; i < players.length; i++){
    if (players[i].id==socket.id){
      cam = [ctx.canvas.width/2-players[i].pos[0], ctx.canvas.height/2-players[i].pos[1]];
      alive = true;
      break;
    }
  }
  //death screen
  if (!alive&&area==1) {
    document.getElementsByClassName("game")[0].style.opacity -= 0.006;
    if (document.getElementsByClassName("game")[0].style.opacity <= 0){
      page(0);
    }
  }
  
  //background
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  var spacing = 30;
  var offset = [cam[0]%spacing, cam[1]%spacing];
  ctx.lineWidth = 0.3;
  ctx.strokeStyle = "black";
  for (var x = 0; x < ctx.canvas.width; x+=spacing) {
    ctx.beginPath();
    ctx.moveTo(offset[0]+x, 0);
    ctx.lineTo(offset[0]+x, ctx.canvas.height);
    ctx.stroke();
  }
  for (var y = 0; y < ctx.canvas.height; y+=spacing){
    ctx.beginPath();
    ctx.moveTo(0, offset[1]+y);
    ctx.lineTo(ctx.canvas.width, offset[1]+y);
    ctx.stroke();
  }

  //draw players
  players.forEach((p)=>{
    //pseudo update for smoothness
    //p.update();
    //username display
    ctx.font = "20px Courier New";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(p.username, p.pos[0]+cam[0],p.pos[1]+cam[1]-50);
    
    //draw players
    drawTank(ctx, p, cam);
    //old tank drawing
    /*ctx.translate(p.pos[0]+cam[0],p.pos[1]+cam[1]);
    ctx.rotate(p.angle);
    ctx.strokeRect(-12,-25,25,50);
    ctx.fillRect(-12,-25,25,50);
    ctx.strokeRect(0,-10,25,20);
    ctx.fillRect(0,-10,25,20);
    ctx.resetTransform();//reset stuff*/
    //ctx.fillRect(p.intersect[0]+cam[0],p.intersect[1]+cam[1],5,5);//collision point
    
    //smoke effects
    if (p.hp <= 0){
      if (Math.random()>0.5){
        //red flame
        particles.push(new Particle(p.pos[0],p.pos[1],Math.random()*4-2,-5+Math.random(),`rgba(255,${Math.random()*200},0,0.8)`,20,5));
      }
      //gray smoke
      var c = Math.random()*200;
      particles.push(new Particle(p.pos[0],p.pos[1],Math.random()*2-0.5,-3+Math.random(),`rgba(${c},${c},${c},0.2)`,60,15));
    }
  });
  
  //draw bullets
  bullets.forEach((b)=>{
    //pseudo update
    updateBullet(b);

    //draw bullets
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.pos[0]+cam[0],b.pos[1]+cam[1],10,0,Math.PI*2);
    ctx.fill();

    /*ctx.beginPath();       // Start a new path
  ctx.moveTo(b.pos[0], b.pos[1]);    // Move the pen to (30, 50)
  ctx.lineTo(b.pos[0]-5*b.vel[0],b.pos[1]-5*b.vel[1]);  // Draw a line to (150, 100)
  ctx.stroke(); */
  });

  //draw particles
  for (var i = 0; i < particles.length; i++){
    var p = particles[i];
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.pos[0]+cam[0],p.pos[1]+cam[1],p.size,0,Math.PI*2);
    ctx.fill();
    p.update();
    if (p.dur <= 0) {
      particles = particles.slice(0,i).concat(particles.slice(i+1));
      i--;
    }
  }

  //draw UI
  //hp bar
  var hp = 0;
  var type = 0;
  for (var i = 0; i < players.length; i++){
    if (players[i].id==socket.id){
      hp = Math.max(0,players[i].hp);
      type = players[i].type;
    }
  }
  hpLen -= (hpLen-hp)/3;
  ctx.strokeRect(ctx.canvas.width/2-200,ctx.canvas.height-75,400,50);
  ctx.fillStyle = "rgb(85,248,20)";
  ctx.fillRect(ctx.canvas.width/2-200,ctx.canvas.height-75,hpLen/tankTypes[type].hp*400,50);
  
},1000/fps);
  
//pseudo updates for graphics (can't import actual update function)
var updatePlayer = function(p){
  if (p.keys.KeyA) p.vel[2] = -0.1;
    if (p.keys.KeyD) p.vel[2] = 0.1;
    if (p.keys.KeyW) {
      p.vel[0] = Math.cos(p.angle) * 5;
      p.vel[1] = Math.sin(p.angle) * 5;
    }
    
    p.pos[0] += p.vel[0];
    p.pos[1] += p.vel[1];
    p.angle += p.vel[2];
    //decellerate
    if (p.vel[0] > 0) p.vel[0] *= 0.6;
    if (p.vel[0] < 0) p.vel[0] *= 0.6;
    if (p.vel[1] > 0) p.vel[1] *= 0.6;
    if (p.vel[1] < 0) p.vel[1] *= 0.6;
    if (p.vel[2] > 0) p.vel[2] *= 0.6;
    if (p.vel[2] < 0) p.vel[2] *= 0.6;
}

var updateBullet = function(b){
  b.pos[0]+=b.vel[0];
  b.pos[1]+=b.vel[1];
  b.dur--;
}