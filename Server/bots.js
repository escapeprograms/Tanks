//neural network bot
var math = require('mathjs');
var game = require("./game.js");

var layerSize = [19,20,4];//layers for neurons, input size of 15, and output size of 4, [19,20,4]
var mutRate = 0.06;//mutation chance
var mutAmount = 0.1;//mutation amount
var simDur = 200;//in frames
var botTankType = 0;

//fitness calculation
var calcFit = function(stats,simTime){
  //input: damage dealt, hp remainig, acc, remaining sim time, check if the players face each other
  return 10*stats.dmg/(stats.shots+0.1) + stats.dmg + 10*simTime/simDur;
}

//create random matrix with size x,y
function randM(x,y) {
  if (!y) y = 1;
  var arr = [];
  for (var i = 0; i < x; i++){
    var row = [];
    for (var j = 0; j < y; j++){
      //row.push(Math.random()/4);
      row.push(0)
    }
    if (x == 1) return row;//return a single row if x = 1
    arr.push(row)
  }
  return arr;
}

var Bot = function(id, network) {
  this.id = id;
  //default weight setup
  this.weights = [];
  this.bias = [];
  var w, b;
  if (network) {
    w = network.weights;
    b = network.bias;
  }
  for (var i = 0; i < layerSize.length-1; i++){
    //weights
    if (!w){
      this.weights.push(randM(layerSize[i], layerSize[i+1]));
    }
    else {
      this.weights.push(w[i]);//transfer weights
    }
    //biases (shifted 1 layer)
    if (!b){
      this.bias.push(randM(1, layerSize[i+1]));
    }
    else {
      this.bias.push(b[i]);//transfer bias
    }
  }
  //transfered weights
  //if (weights) this.weights = [weights][0];

  //mutate weights
  this.mutateWeights = function() {
    for (var a = 0; a < this.weights.length; a++){//layer
    for (var b = 0; b < this.weights[a].length; b++){//node
    for (var c = 0; c < this.weights[a][b].length; c++){//weight
      if (Math.random() < mutRate) {
        this.weights[a][b][c] += -(Math.random()*mutAmount) + mutAmount/2;
        //mutate weight
        if (Math.random() < mutRate*2) {
          this.weights[a][b][c] = 0;//clear weight chance
        }
      }
    }
    }
    }
  }
  this.mutateBiases = function() {
    for (var a = 0; a < this.bias.length; a++){//layer
    for (var b = 0; b < this.bias[a].length; b++){//bias
      if (Math.random() < mutRate) {
        this.bias[a][b] += -(Math.random()*mutAmount) + mutAmount/2;
        //mutate weight
        if (Math.random() < mutRate*2) {
          this.bias[a][b] = 0;//clear bias chance
        }
      }
    }
    }
  }
  
  //activate sigmoid function
  this.sigmoid = function(Z) {
    var A = [];
    for (var i = 0; i < Z.length; i++) {
      A.push(1/(1 + Math.pow(Math.E,-Z[i])));
    }
    return A;
  }
  //recursive forward propagation
  this.forward = function(input,n) {
    if (!n) n = 0;
    if (n >= this.weights.length) return this.sigmoid(input);
    var X = math.matrix(input);
    var W = math.matrix(this.weights[n]);
    var Z = math.add(math.multiply(X,W),this.bias[n]).valueOf();
    return this.forward(Z,n+1);
  }
  
  //keys the bot presses from velocity, line of sight input
  this.respond = function(sightLines) {
    var f = this.forward(sightLines);
    var keys = {};
    if (f[0]>0.5){
      keys.KeyA = true;
    }
    if (f[1]>0.5){
      keys.KeyD = true;
    }
    if (f[2]>0.5){
      keys.KeyW = true;
    }
    if (f[3]>0.5){
      keys.Space = true;
    }
    return keys;
  }
};

var Simulation = function(pos,w1,fit){
  this.fit = fit;//fitness score
  if (!fit) this.fit = 0;
  //bots must control players "1" and "2"
  this.results = [];//returns with weights and score
  //this.bots = [new Bot("1"), new Bot("2")];
  this.bots = [new Bot("1",w1)];
  if (!w1) {
    //this.bots = [new Bot("1",w1), new Bot("2",w2)];
    //this.bots = [new Bot("1")];
  }
  
  this.players = [];
  this.bullets = [];
  this.players.push(new game.Player("1", "Bot 1", botTankType));
  //this.players.push(new game.Player("2", "Bot 2", botTankType));
  this.players.push(new game.Player("2", "dummy",0))

  //preposition
  //var p = Math.round(Math.random());
  this.players[0].pos = [0,0];
  this.players[0].angle = 0;
  //this.players[1-p].pos = [300,Math.random()*50];
  //this.players[1-p].angle = Math.PI;
  this.players[1].pos = [pos[0],pos[1]];
  this.players[1].angle = pos[2];
  
  this.stats = [{//dmg, hp, shots
    dmg:0,
    hp:this.players[0].hp,
    shots:0
  }];

  this.simTime = simDur;//total duration

  this.mutate = function() {
    this.bots[0].mutateWeights();
    this.bots[0].mutateBiases();
  }
  
  this.update = function() {
    if (this.simTime <= 0) {
      this.simTime = -1;
      return;//stop running after simulation ends
    }
    //check all players
    this.players.forEach((p, index)=>{
      //bot inputs 
      if (this.bots[index]){
        var sightLines = p.calcSightLines(this.players);
        p.keys = this.bots[index].respond(sightLines);
        if (sightLines[0]!=0){
          //console.log(sightLines)
        }
      }
      
      //console.log(p.calcSightLines(this.players))
      p.update(this.players, this.bullets);
      //shoot
      if (p.shooting){
        p.guns.forEach((g)=>{
          var angle = g.angle + Math.random()*p.spread-p.spread/2;
          this.bullets.push(new game.Bullet(p.id, g.pos[0],g.pos[1],Math.cos(angle) * 15, Math.sin(angle) * 15, p.color, 100, p.dmg));
        this.stats[index].shots++;
        });
        
        p.shooting = false;//stop shooting
      }
      //bot death -> end sim
      if (p.hp <= 0){
        this.endSim();
      }
    });
    
    //check all bullets
    for (var i = 0; i < this.bullets.length; i++){
      var b = this.bullets[i];
      b.update();
      if (b.dur<=0) {
        if (b.hit){
          //find bullet owner
          for (var pl = 0; pl < this.players.length; pl++){
            if (b.id == this.players[pl].id)
              this.stats[pl].dmg+=1;//add damage for player
          }
        }
        this.bullets = this.bullets.slice(0,i).concat(this.bullets.slice(i+1));
        i--;
      }
    }
    this.simTime--;
    if (this.simTime == 0) {
      this.endSim();
    }
  }

  //end sim
  this.endSim = function() {
    this.stats[0].hp = this.players[0].hp;
    //this.stats[1].hp = this.players[1].hp;
    var f1 = calcFit(this.stats[0], this.simTime);
    this.fit +=f1;
    //var f2 = calcFit(this.stats[1], this.simTime);
    this.results = [{weights:this.bots[0].weights,bias:this.bots[0].bias}, this.fit];
    //this.results.push([this.bots[1].weights,f2]);
    this.simTime = -1;
  }
}

module.exports = {Bot, Simulation};