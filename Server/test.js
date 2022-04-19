const fs = require("fs");
const math = require('mathjs');

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

var w1 = [
  [
    [1,2],
    [3,4],
    [5,6]
  ],
  [
    [10,20],
    [30,40],
  ]
];
var w2 = [
  [
    [0.1,0.2],
    [0.3,0.4],
    [0.5,0.6]
  ],
  [
    [11,22],
    [33,44],
  ]
];
console.log(isEqual(w1,w1));