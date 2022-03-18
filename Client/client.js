const socket = io();//from server.js

//update keys pressed
var keys = {};
function addKey(e) {
  if(e) {
    keys[e.code]= true;
  }
  socket.emit("input",{id:socket.id,keys:keys});//send id and keys down
}
function removeKey(e) {
  if(e) {
    //search and delete key from keys 
    keys[e.code]= false;
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
  console.log(text);
});

//canvas and display
var fps = 40;
var ctx = document.getElementById('canvas').getContext('2d')
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

setInterval(()=>{
  //background
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  //draw players
  players.forEach((p)=>{
    //pseudo update for smoothness
    //updatePlayer(p);
    
    //draw players
    ctx.fillStyle = p.color;
    ctx.strokeStyle = "black";
    ctx.translate(p.pos[0],p.pos[1]);
    ctx.rotate(p.angle);
    ctx.strokeRect(-12,-25,25,50);
    ctx.fillRect(-12,-25,25,50);
    ctx.strokeRect(0,-10,25,20);
    ctx.fillRect(0,-10,25,20);
    ctx.resetTransform();//reset stuff
    //draw raw hitboxes
    ctx.beginPath();       // Start a new path
    ctx.moveTo(p.corners[0][0], p.corners[0][1]);    
    ctx.lineTo(p.corners[1][0],p.corners[1][1]);
    ctx.lineTo(p.corners[2][0],p.corners[2][1]);
    ctx.lineTo(p.corners[3][0],p.corners[3][1]);
    ctx.lineTo(p.corners[0][0], p.corners[0][1]);   
  ctx.stroke();
    ctx.fillRect(p.intersect[0],p.intersect[1],5,5);
  });

  //draw bullets
  bullets.forEach((b)=>{
    //pseudo update
    updateBullet(b);

    //draw bullets
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.pos[0],b.pos[1],10,0,Math.PI*2);
    ctx.fill();

    /*ctx.beginPath();       // Start a new path
  ctx.moveTo(b.pos[0], b.pos[1]);    // Move the pen to (30, 50)
  ctx.lineTo(b.pos[0]-5*b.vel[0],b.pos[1]-5*b.vel[1]);  // Draw a line to (150, 100)
  ctx.stroke(); */
  });
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