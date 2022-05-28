const fs = require("fs");
const math = require('mathjs');
const _ = require("lodash");
const bots = require("./bots.js");

crossOver = function(w1, w2){
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

unflatten = function(w,template) {
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

function isEqual(w1,w2){
  var flat1 = math.flatten(w1);
  var flat2 = math.flatten(w2);
  for (var i = 0; i < flat1.length; i++){
    if (flat1[i] != flat2[i]) return false;
  }
  return true;
}

function sortResults(){
    //Start from the second element.
    for(let i = 1; i < results.length;i++){
        //Go through the elements behind it.
        for(let j = i - 1; j > -1; j--){
            //value comparison using ascending order.
            if(results[j + 1][1] > results[j][1]){//NOTE: ADD BACK [1] later
                //swap
                [results[j+1],results[j]] = [results[j],results[j + 1]];
            }
        }
    }
}

var w = [
  [
    [
      0.192568385610431,
      0.05389724145564245,
      0.041428484330964466,
      0.24917383336955612
    ]
  ],
  [
    [
      -0.14597007631390035,
      0.18636008848799146,
      0.15296943567069465,
      0.09611558508135165
    ],
    [
      0.24514801397089314,
      0.061386916770423405,
      -0.09646418380118293,
      -0.011954158527509584
    ],
    [
      0.09167284259073993,
      -0.15337952832296609,
      0.2023424773301289,
      0.08938585955512157
    ],
    [
      0.06056796400498288,
      -0.15229101639897025,
      -0.2199654558184737,
      0.17022962976025746
    ]
  ]
];
var w2 = [
  [
    [
      0.192568385610431,
      0.05389724145564245,
      0.041428484330964466,
      0.24917383336955612
    ]
  ],
  [
    [
      -0.14597007631390035,
      0.18636008848799146,
      0.15296943567069465,
      0.09611558508135165
    ],
    [
      0.24514801397089314,
      0.061386916770423405,
      -0.09646418380118293,
      -0.011954158527509584
    ],
    [
      0.09167284259073993,
      -0.15337952832296609,
      0.2023424773301289,
      0.08938585955512157
    ],
    [
      0.06056796400498288,
      -0.15229101639897025,
      -0.2199654558184737,
      0.17022962976025746
    ]
  ]
];

//fitness
var calcFit = function(r){
  return r[0]+r[1]-r[2]-r[3];//maximize first 2 values, minimize second 2 values
}
var results = [];
//add sims
var sims = [];
for (var i = 0; i < 5; i++) {
  sims.push(_.cloneDeep(new bots.Bot("DUMB"+i,w)))
}
//sims = _.cloneDeep(sims);
var testBot = new bots.Bot("TESTO",w);


/*for (var i = 0; i < sims.length; i++){
  console.log(sims[i].weights[0][0]);//display
}
console.log("------")
for (var i = 0; i < sims.length; i++){
  sims[i].mutateWeights();
  console.log(sims[i].weights[0][0]);//display
  var fit = calcFit(sims[i].forward([1]));
  results.push([sims[i].weights,fit,sims[i].id]);
}
console.log("------")
for (var i = 0; i < sims.length; i++){
  //sims[i].mutateWeights();
  console.log(sims[i].weights[0][0]);//display
}*/
/*console.log("=======")
var simss = [];
for (var i = 0; i < 5; i++) {
  simss.push(new bots.Bot("poop"+i,w));
}
simss = lodashClonedeep(simss)
//sims[0].mutateWeights();

for (var i = 0; i < simss.length; i++){
  console.log(simss[i].weights[0][0]);//display
}
for (var i = 0; i < simss.length; i++) {
  simss[i].mutateWeights();
}
console.log("------")
for (var i = 0; i < simss.length; i++){
  console.log(simss[i].weights[0][0]);//display
  var fit = calcFit(simss[i].forward([1]));
  results.push([simss[i].weights,fit,simss[i].id]);
}
console.log("------")
for (var i = 0; i < simss.length; i++){
  //sims[i].mutateWeights();
  console.log(simss[i].weights[0][0]);//display
}
*/
//BIG TEST

/*
for (var gen = 0; gen < 15; gen++) {
  console.log("GENERATION "+gen)
  for (var i = 0; i < sims.length; i++){
    //sims[i].mutateWeights();
    //console.log(sims[i].weights[0][0]);//display
  }
  console.log("------")
  //sims[4].mutateWeights();
  for (var j = 0; j < sims.length; j++){
    console.log(sims[j].weights[0][0]);//display
    var fit = calcFit(sims[j].forward([1]));
    results.push([sims[j].weights,fit,sims[j].id]);
  }
  console.log("------")
  for (var k = 0; k < sims.length; k++){
    //sims[i].mutateWeights();
    //console.log(sims[k].weights[0][0]);//display
  }
    
  sortResults();
  console.log(results)
  var top = results[0][0];
  //show best bot
  var bestBot = _.cloneDeep(new bots.Bot("BEST",top));
  console.log("Best Bot: "+bestBot.forward([1]));

  //reset
  results = [];
  sims = [bestBot];
  for (var i = 1; i < 5; i++) {
    sims.push(_.cloneDeep(new bots.Bot("new"+i,top)));
  }
  for (var i = 1; i < 5; i++) {
    sims[i].mutateWeights();
  }
  //sims[0].mutateWeights();
  
  console.log(isEqual(sims[0].weights,sims[1].weights))

}
*/

//lodash test

/*var list = [];
var o = function(f){
  this.x = {val:[f[0]]};
  this.ad = function(){
    this.x.val[0] = Math.random();
  }
};
list.push(_.cloneDeep(new bots.Bot("DUMB",w)));
list.push(_.cloneDeep(new bots.Bot("DUMBER",w)));

list = _.cloneDeep(list);
console.log(list[0].weights[0]);

list[0].mutateWeights();

console.log(list[1].weights[0]);
console.log(list[0].weights[0]);*/

