//different tank types
var tankTypes = [
  {
    name:"Standard",
    hp:100,
    dmg:40,//64 dps
    spread:0.1,
    acc:1,
    maxVel:4,
    cooldown:25,
    dur:80,
    vertices:[[-12,-25],[12,-25],[12,25],[-12,25]],
    mass:5,
    guns: [{pos:[0,0], angle:0}]
  },
  {
    name:"Zoomer",
    hp:70,
    dmg:20,//53 dps
    spread:0.3,
    acc:4,
    maxVel:8,
    cooldown:15,
    dur:40,
    vertices:[[-12,-20],[30,0],[-12,20]],
    mass:3,
    guns: [{pos:[0,0], angle:0}]
  },
  {
    name:"Artillery",
    hp:160,
    dmg:120,//60 dps
    spread:0,
    acc:1,
    maxVel:1,
    cooldown:80,
    dur:100,
    vertices:[[-25,-25],[12,-30],[18,0],[12,30],[-25,25]],
    mass:10,
    guns: [{pos:[0,0], angle:0}]
  },
  {
    name:"Shotty",
    hp:110,
    dmg:15,//90 dps
    spread:0,
    acc:3,
    maxVel:5,
    cooldown:40,
    dur:20,
    vertices:[[-15,-20],[12,-25],[12,25],[-15,20]],
    mass:6,
    guns:[{pos:[0,0], angle:-0.25},
          {pos:[0,0], angle:-0.15},
          {pos:[0,0], angle:-0.05},
          {pos:[0,0], angle:0.05},
          {pos:[0,0], angle:0.15},
          {pos:[0,0], angle:0.25}]
  },
  {
    name:"Fidget Spinner",
    hp:120,
    dmg:10,//40 dps
    spread:0.1,
    acc:1,
    maxVel:3,
    cooldown:10,
    dur:60,
    vertices:[[-15,26],[30,0],[-15,-26]],
    mass:10,
    guns: [{pos:[0,0], angle:0},
           {pos:[0,0], angle:2*Math.PI/3},
           {pos:[0,0], angle:4*Math.PI/3}]
  },
  {
    name:"Starlord",
    hp:90,
    dmg:20,//123 dps
    spread:0.2,
    acc:1.5,
    maxVel:6,
    cooldown:13,
    dur:70,
    vertices:[[-12,-25],[12,-25],[12,25],[-12,25]],
    mass:4,
    guns: [{pos:[0,-10], angle:0},
           {pos:[0,10], angle:0}]
  },
  {
    name:"Flubby",
    hp:169,
    dmg:10,//200 dps
    spread:Math.PI*2,
    acc:1,
    maxVel:1,
    cooldown:2,
    dur:40,
    vertices:[[-18,-25],[12,-20],[18,0],[12,30],[-25,25],[-20,10]],
    mass:15,
    guns:[{pos:[0,0], angle:0}]
  },
  {
    name:"The Hammer",
    hp:120,
    dmg:4,//80 dps
    spread:0.3,
    acc:1,
    maxVel:3,
    cooldown:2,
    dur:40,
    vertices:[[-20,-25],[17,-22],[25,0],[17,22],[-20,25]],
    mass:5,
    guns:[{pos:[0,0], angle:0}]
  },
  {
    name:"Godkiller",
    hp:100,
    dmg:30,//60 dps
    spread:0,
    acc:1,
    maxVel:1,
    cooldown:60,
    dur:40,
    vertices:[[-20,-25],[17,-22],[25,0],[17,22],[-20,25]],
    mass:5,
    guns:[{pos:[0,-10], angle:0},
          {pos:[0,10], angle:0},
          {pos:[10,0], angle:0}]
  },
  {
    name:"Antichaser",
    hp:90,
    dmg:20,//53 dps
    spread:0.3,
    acc:3,
    maxVel:6,
    cooldown:15,
    dur:50,
    vertices:[[-15,20],[30,0],[-15,-20]],
    mass:3,
    guns:[{pos:[0,0], angle:3/4*Math.PI},
          {pos:[0,0], angle:5/4*Math.PI}]
  }
];

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
  if (!y){y = (o[1][1]+o[2][1])/2;}//vertical lines
  if ((x>=a[0]&&x<=b[0]||x>=b[0]&&x<=a[0])&&(x>=c[0]&&x<=d[0]||x>=d[0]&&x<=c[0])&&
  (y>=a[1]&&y<=b[1]||y>=b[1]&&y<=a[1])&&(y>=c[1]&&y<=d[1]||y>=d[1]&&y<=c[1])){
    return [x,y];//return intersection point
  }
  return false;
};


var Player = function(id, user, type){
  this.username = user;//for display
  this.id = id;
  this.type = type;
  if (!type) this.type = 0;
  this.kills = 0;//kill tracker
  this.lastHit = "";//who got the last hit on the player
  
  this.keys = {};//list of keys pressed (true=down, false=up)
  this.color = `rgb(
        ${Math.random()*255},
        ${Math.random()*255},
        ${Math.random()*255})`;
  //make a spawn position
  var spawnAngle = Math.random() * 2*Math.PI;
  var spawnDist = Math.random()*500;
  this.pos = [Math.cos(spawnAngle)*spawnDist, Math.sin(spawnAngle)*spawnDist, Math.random()*Math.PI];//x, y
  
  this.vel = [0,0,0];//vx, vy, vangle
  this.acc = tankTypes[this.type].acc;
  this.maxVel = tankTypes[this.type].maxVel;
  this.mass = tankTypes[this.type].mass;

  this.angle = Math.random()*Math.PI*2;//angle in radians

  this.corners = [];//corners calculated for collisions
  this.intersect = [];

  this.cooldown = tankTypes[this.type].cooldown;
  this.shooting = false;
  this.hp = tankTypes[this.type].hp;
  this.dmg = tankTypes[this.type].dmg;
  this.spread = tankTypes[this.type].spread;

  //gun position + angle info, ensure disconnect from tankTypes
  this.guns = JSON.parse(JSON.stringify(tankTypes[this.type].guns));
  
  this.update = function(players, bullets){
    if (this.hp <= 0) this.keys = [];//stop getting inputs if dead
    this.shooting = false;
    //movement keys
    if (this.keys.KeyA) this.vel[2] -= 0.1;
    if (this.keys.KeyD) this.vel[2] += 0.1;
    if (this.keys.KeyW) {
      //speed limiter
      var aVel = Math.atan2(this.vel[1],this.vel[0]);//angle of velocity
      var angleDif = aVel-this.angle;//angle between velocity vector and facing direction
      var speed = Math.sqrt((this.vel[0])**2 + (this.vel[1])**2);
      if (speed*Math.cos(angleDif) < this.maxVel){//dot product
        this.vel[0] += Math.cos(this.angle) * this.acc;
        this.vel[1] += Math.sin(this.angle) * this.acc;
      }
    }
    //constrain max speed - OLD
    /*var maxSpeed = 5;
    this.vel[0] = Math.min(Math.max(this.vel[0], -maxSpeed*Math.abs(Math.cos(this.angle))), maxSpeed*Math.abs(Math.cos(this.angle)));
    this.vel[1] = Math.min(Math.max(this.vel[1], -maxSpeed*Math.abs(Math.sin(this.angle))), maxSpeed*Math.abs(Math.sin(this.angle)));*/
    this.vel[2] = Math.min(Math.max(this.vel[2], -0.07), 0.07);//limit rotation
    //shoot
    if (this.keys.Space){
        this.shoot(bullets);
    }
    this.cooldown--;
    
    this.calcCorners();
    var ct = this.collideTanks(players);//use storage var to save cpu
    
    for (var i = 0; i < ct.length; i++){
      var intersect = ct[i][1];//point of collision
      this.intersect = intersect;
      var target = players[ct[i][0]];
      
      var r1 = Math.sqrt((intersect[0]-this.pos[0])**2 + (intersect[1]-this.pos[1])**2);//distance from center of mass
      var r2 = Math.sqrt((intersect[0]-target.pos[0])**2 + (intersect[1]-target.pos[1])**2);//distance from center of mass
      var a1 = Math.atan2(intersect[1]-this.pos[1],intersect[0]-this.pos[0]);//angle from center of mass
      var a2 = Math.atan2(intersect[1]-target.pos[1],intersect[0]-target.pos[0]);//angle from center of mass
      //velocity of intersection point (relative to CM)
      var v1 = [r1*(Math.cos(a1)-Math.cos(a1-this.vel[2])),
               r1*(Math.sin(a1)-Math.sin(a1-this.vel[2]))];
      var v2 = [r2*(Math.cos(a2)-Math.cos(a2-target.vel[2])),
               r2*(Math.sin(a2)-Math.sin(a2-target.vel[2]))];
      
      //update momentums
      var mult = 1.3;//extra bump to prevent phasing
      var massRatio = this.mass/target.mass;
      var tempvel = [this.vel[0],this.vel[1]];
      this.vel[0] = (target.vel[0]+mult*(v2[0]-v1[0]))/massRatio;
      this.vel[1] = (target.vel[1]+mult*(v2[1]-v1[1]))/massRatio;
      target.vel[0] = (tempvel[0]+mult*(v1[0]-v2[0]))*massRatio;
      target.vel[1] = (tempvel[1]+mult*(v1[1]-v2[1]))*massRatio;
      this.pos[0] += this.vel[0];
      this.pos[1] += this.vel[1];
      
    }
    //update positions
    this.pos[0] += this.vel[0];
    this.pos[1] += this.vel[1];
    this.angle += this.vel[2];
    
    //decellerate
    var acc = 0.9;
    if (this.vel[0] > 0) this.vel[0] *= acc;
    if (this.vel[0] < 0) this.vel[0] *= acc;
    if (this.vel[1] > 0) this.vel[1] *= acc;
    if (this.vel[1] < 0) this.vel[1] *= acc;
    if (this.vel[2] > 0) this.vel[2] *= acc/1.5;
    if (this.vel[2] < 0) this.vel[2] *= acc/1.5;

    //collision logic bullets
    this.calcCorners();
    this.collideBullets(bullets);
  };
  this.shoot = function(bullets){
    if (this.cooldown<=0){
      this.updateGuns();
      this.shooting = true;//deal with bullet spawn in server.js
      this.cooldown = tankTypes[this.type].cooldown;
    }
  }
  //updates info for bullet spawn
  this.updateGuns = function(){
    for (var i = 0; i < this.guns.length; i++){
      var g = tankTypes[this.type].guns[i];
      //positional info
      var len = Math.sqrt((g.pos[0])**2+(g.pos[1])**2);
      var angle2 = Math.atan2(g.pos[1],g.pos[0]);
      this.guns[i].pos = [this.pos[0]+(Math.cos(this.angle+angle2) * len), this.pos[1]+(Math.sin(this.angle+angle2) * len)];
      this.guns[i].angle = this.angle + g.angle;
    }
  }
  
  this.calcCorners = function(){
    var verts = tankTypes[this.type].vertices;
    for (var i = 0; i < verts.length; i++){
      var len = Math.sqrt((verts[i][0])**2+(verts[i][1])**2);
      var angle2 = Math.atan2(verts[i][1],verts[i][0]);
      this.corners[i] = [this.pos[0]+(Math.cos(this.angle+angle2) * len), this.pos[1]+(Math.sin(this.angle+angle2) * len)];
    }
    //OLD corner positions
    /*var len = Math.sqrt((playerDimensions[0]/2)**2+(playerDimensions[1]/2)**2);
    var angle2 = Math.atan(playerDimensions[1]/playerDimensions[0]);
    
    this.corners[0] = [this.pos[0]+(Math.cos(this.angle-angle2) * len), this.pos[1]+(Math.sin(this.angle-angle2) * len)];
    this.corners[1] = [this.pos[0]+(Math.cos(this.angle+angle2) * len), this.pos[1]+(Math.sin(this.angle+angle2) * len)];
    this.corners[2] = [this.pos[0]+(Math.cos(Math.PI+this.angle-angle2) * len), this.pos[1]+(Math.sin(Math.PI+this.angle-angle2) * len)];
    this.corners[3] = [this.pos[0]+(Math.cos(Math.PI+this.angle+angle2) * len), this.pos[1]+(Math.sin(Math.PI+this.angle+angle2) * len)];*/
  }
  
  this.collideBullets = function(bullets){
    for (var i = 0; i < bullets.length; i++){
      var b = bullets[i];
      //skip bullets of same id
      if (b.id == this.id) continue;
      
      //draw an imaginary path of the bullet and check if it crosses any lines within the tank
      var b1 = b.pos;//current bullet position
      var b2 = [b.pos[0]-2*b.vel[0],b.pos[1]-2*b.vel[1]];//past position
      //check if bullet crosses any boundary
      for (var s = 0; s < this.corners.length; s++){
        if (lineLineCross(b1,b2,this.corners[s], this.corners[(s+1)%this.corners.length])){
          //push enemies back
          this.vel[0] += b.vel[0]/this.mass;
          this.vel[1] += b.vel[1]/this.mass;
          b.hit = true;
          this.hp -= b.dmg;//lose hp
          bullets[i].dur = 0;//destroy bullet
          this.lastHit = b.id;
        }
      }
      /*if (//check if the line crosses into the tank
        lineLineCross(b1,b2,this.corners[0],this.corners[1])||
        lineLineCross(b1,b2,this.corners[1],this.corners[2])||
        lineLineCross(b1,b2,this.corners[2],this.corners[3])||
        lineLineCross(b1,b2,this.corners[3],this.corners[0])
        ){
        //push enemies back
        this.vel[0] += b.vel[0]/4;
        this.vel[1] += b.vel[1]/4;
        this.hp -= b.dmg;//lose hp
        bullets[i].dur = 0;//destroy bullet
      }*/
    }
  }
  this.collideTanks = function(players){
    var colliding = [];
    for (var i = 0; i < players.length; i++){
      var p = players[i];
      //skip itself
      if (p.id == this.id) continue;
      
      //check if any boundary line of the two tanks cross
      edges:for (var c = 0; c < p.corners.length; c++){
        for (var d = 0; d < this.corners.length; d++){
          var intersect = lineLineCross(p.corners[c], p.corners[(c+1)%p.corners.length],       
              this.corners[d], this.corners[(d+1)%this.corners.length]);
          if (intersect){
            //return # for offending tank, intersection point
            colliding.push([i,intersect]);
            break edges;//only allow 1 collision between 2 specific tanks
          }
        }
      }
    }
    return colliding;//return a list of every colliding tank
  }

  //calculate sightLines
  this.calcSightLines = function(players) {
    //bot range
    var botRange = 600;
    var numLines = 19;
    var divisions = 3;//check secondary lines near the main lines
    var sightLines = [];//sightline value will scale from 0 to 1 based on how close the target is
    for (var i = 0; i < numLines; i++){
      var angle = this.angle+i*2*Math.PI/numLines;//full circle of range
      var detected = false;
      section:for (var j = 0; j < divisions; j++) {
        var angle2 = angle - Math.PI/numLines + j*2*Math.PI/numLines/divisions;
        var endPoint = [botRange*Math.cos(angle2) + this.pos[0],
                     botRange*Math.sin(angle2) + this.pos[1]];
      
        tank:for (var t = 0; t < players.length; t++){
          //check every line in tank
          var p = players[t];
          if (p.id==this.id) continue;//skip itself
          
          for (var d = 0; d < p.corners.length; d++){
            var intersect = lineLineCross(p.corners[d], p.corners[(d+1)%p.corners.length], this.pos, endPoint);
            if (intersect){
              //return inverse distance
              detected = true;
              var dist = Math.sqrt((intersect[0]-this.pos[0])**2 + (intersect[1]-this.pos[1])**2);
              sightLines.push(1-(dist/botRange));
              break section;
            }
          }
        }
      }
      
      if (!detected) {
        sightLines.push(0);
      }
    }
    return sightLines;
  }
}

var Bullet = function(id, x, y, dx, dy, color, duration, damage){
  this.id = id;//id of shooter
  this.pos = [x, y];//x,y
  this.vel = [dx, dy];
  this.color = color;
  this.dur = duration;
  this.dmg = damage;
  this.hit = false;//if bullet got a hit
  this.update = function(){
    this.pos[0] += this.vel[0];
    this.pos[1] += this.vel[1];
    this.dur--;
  };
}

module.exports = {Player, Bullet, tankTypes};