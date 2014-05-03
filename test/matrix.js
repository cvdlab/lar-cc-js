var mtx = require('../lib/math/Matrix.js');

/*
var a = new mtx.DenseMatrix(2,2,[[1,0],[0,1]]);
var b = new mtx.DenseMatrix(2,2,[[2,0],[0,2]]);
console.log(b.getData());
var c = a.multiply(b);
console.log(c.getData());
var k = new mtx.DenseMatrix(2,3,[[1,0,1],[0,1,0]]).transpose();
console.log(k.getData());

var sa = new mtx.CsrMatrix([0,1,2],[0,1],[1,1],2,2);
var sb = new mtx.CsrMatrix([0,1,2],[0,1],[2,2],2,2);
var sc = sa.multiply(sb);
console.log(sc);
console.log(sc.toDense());
var sd = new mtx.CsrMatrix([0,1,2,3],[0,1,1],[1,1,1],2,2);
console.log(sd.toDense());
console.log(sd.transpose().toDense());
*/

var arr1 = [0,0,1,2,2];
var arr2 = [0,1,2,1,2];
var arr3 = [1,5,7,2,1];

var coo = new mtx.CooMatrix(arr1,arr2,arr3,3,3);
console.log(coo.toDense());

var cooT = coo.transpose();
console.log(cooT);
console.log(cooT.toCsr());
console.log("--");
console.log(cooT);
console.log(cooT.toCsr().toCoo());
console.log("--");
console.log(cooT.toDense());
console.log(cooT.toCsr().toDense());