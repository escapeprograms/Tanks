/*Uses express and socket.io and nodemon --save-dev for convenience
npm run bots to run this server
USE THIS SERVER FOR TRAINING BOTS
*/
//server vars
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const fs = require("fs");
const math = require('mathjs')
const _ = require("lodash")

var game = require("./game.js");//get all game classes
var bot = require("./bots.js");

const clientPath = __dirname +"/../Client"
console.log("Serving static from "+clientPath);

const app = express();
app.use(express.static(clientPath))

const server = http.createServer(app);
const io = socketio(server);

var spectators = [];
var simulations = [];
var numSims = 60;
var selectedBots = 6;
var results = [];//all weights of a generation + fitness
var generationBests = [];//record best weights for all gen
var displaySim;//simulation displayed
var dummyPos = [100,0,0];//x,y,angle

//on initial connection
io.on("connection", (socket)=>{
  socket.emit("message","You are connected!");//send to new user only
  console.log("connecting player " + socket.id);

  //player clicks start
  socket.on("start",(obj)=>{
    console.log("player joined " + socket.id, obj.username)
    spectators.push(new game.Player(socket.id, obj.username, obj.type));
  });

  //check for inputs
  socket.on("input",(obj)=>{
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
    for (var i = 0; i < spectators.length; i++){
      if (spectators[i].id==socket.id){
        console.log("disconnecting player "+socket.id)
        spectators = spectators.slice(0,i).concat(spectators.slice(i+1));//delete player
        break;
      }
  }
  });
});
//sort algo
function sortResults(arr){
    //Start from the second element.
    for(let i = 1; i < arr.length;i++){
        //Go through the elements behind it.
        for(let j = i - 1; j > -1; j--){
            //value comparison using ascending order.
            if(arr[j + 1][1] > arr[j][1]){
                //swap
                [arr[j+1],arr[j]] = [arr[j],arr[j + 1]];
            }
        }
    }
  return arr;
}

//geneitic crossover
function crossOver(w1, w2){
  //get shape of weights in a template
  var fw1 = w1;
  var fw2 = w2;
  //flatten
  var flat1 = math.flatten(w1);
  var flat2 = math.flatten(w2);
  //crossover
  var cross = Math.floor(Math.random()*flat1.length);
  var temp = flat1;
  flat1 = flat1.slice(0,cross).concat(flat2.slice(cross));
  flat2 = flat2.slice(0,cross).concat(temp.slice(cross));
  //unflatten weights
  var nw1 = unflatten(flat1,fw1);
  var nw2 = unflatten(flat2,fw2);
  return [nw1,nw2];
}

function unflatten(w,template) {
  var i = 0;
  for (var a = 0; a < template.length; a++){//layer
  for (var b = 0; b < template[a].length; b++){//node
  for (var c = 0; c < template[a][b].length; c++){//weight
    template[a][b][c] = w[i];
    i++;
  }
  }
  }
  return template;
}

//test comparison
function isEqual(w1,w2){
  var flat1 = math.flatten(w1);
  var flat2 = math.flatten(w2);
  if (flat1.length!=flat2.length) return false;
  for (var i = 0; i < flat1.length; i++){
    if (flat1[i] != flat2[i]) return false;
  }
  return true;
}

//Simulation
function startSims(pos,results,cross) {//array of weights
  for (var i = 0; i < numSims; i+=2){
    if (results){
      //result = [m][weights,fitness]
      var r1 = results[Math.floor(Math.random()*results.length)];
      var r2 = results[Math.floor(Math.random()*results.length)];
      if (!cross) {//don't crossover
        simulations.push(_.cloneDeep(new bot.Simulation(pos,r1[0])));
        simulations.push(_.cloneDeep(new bot.Simulation(pos,r2[0])));
      } else {//crossover
        var cr = crossOver(r1[0].weights,r2[0].weights);
        var crb = crossOver(r1[0].bias,r2[0].bias);
        simulations.push(_.cloneDeep(new bot.Simulation(pos, {weights:cr[0], bias:crb[0]})));
        simulations.push(_.cloneDeep(new bot.Simulation(pos,{weights:cr[1], bias:crb[1]})));
      }
      
    }
    else {
      simulations.push(_.cloneDeep(new bot.Simulation(pos)));
    }
  }
}
//get previously trained weights
var w = [];
var rawdata = fs.readFileSync(__dirname+'/log.txt');
w = JSON.parse(rawdata);
startSims(dummyPos,[[w]]);//initial start
//startSims(dummyPos);

var oldBest = [];
var allPlayers = [];
var allBullets = [];

var tps = 40;//tick per sec server side
setInterval(()=>{
  //check all players
  if (simulations.length==0) {
    //INTERESTING: MUTATIONS APPEAR TO STOP AS SOON AS A BOT SCORES POINTS
    //sort all results
    results = sortResults(results);
    //save info
    results = results.slice(0,selectedBots);//get only the best
    generationBests.push(results);
    console.log(results);
    io.emit("message",results);
    io.emit("message","generation "+generationBests.length)
    var bestBot = results[0][0];//weights and bias of best ranker
    
    //start new gen
    //pick a dummy start position, only if there was a successful bot
    if (results[0][1] != 0) {
      var dummyAngle = Math.random() * 2*Math.PI;
      var dummyDist = Math.random()*400+100;
      dummyPos = [Math.cos(dummyAngle)*dummyDist, Math.sin(dummyAngle)*dummyDist, Math.random()*Math.PI];
    }
    
    for (var i = 0; i < results.length; i++){
      results[i][1] = 0;//reset fit score for next gen
    }
    //start other sims
    startSims(dummyPos,results,true);
    for (var i = 0; i < simulations.length; i++) {
      //mutate weights
      simulations[i].mutate();
    }
    //put the best simulation in
    simulations.push(_.cloneDeep(new bot.Simulation(dummyPos,bestBot)));
    results = [];
  }
  //reset display
  allPlayers = [];
  allBullets = [];
  //update every sim
  for (var i = 0; i < simulations.length; i++){
    var s = simulations[i];
    s.update();
    //add to display
    allPlayers = allPlayers.concat(s.players);
    allBullets = allBullets.concat(s.bullets);
    if (s.simTime == -1) {
      /*for (var r = 0; r < s.results.length; r++){
        results.push(s.results[r]);//put each bot
      }*/
      results.push(s.results);
      simulations = simulations.slice(0,i).concat(simulations.slice(i+1));
      i--;
    }
  }
  //send all spectator data and bullet data
  allPlayers = allPlayers.slice(0,30);
  allBullets = allBullets.slice(0,30);
  io.emit("ping",[allPlayers,allBullets]);
},1000/tps);

//server stuff
server.on("error",(e)=>{
  console.log("Server error: "+ e);
  server.close();
});

server.listen(3000, ()=>{
  console.log("HI, starting server...");
});