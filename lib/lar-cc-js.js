!(function (exports) {

  var argue = require('arguejs');
  var mtx = require('./lib/math/Matrix.js');

  /**
   * Library namespace.
   */

  var lar = exports.lar = {};

  /**
   * Library version.
   */

  lar.version = '0.0.1';

  /**
   * Dependancies
   */

  // var numeric = require('numeric');
  
  /**
   * Variables
   */

  lar.sparse = true;

  var max = Math.max;
  var min = Math.min;
  var abs = Math.abs;

  

  /**
   * Utility function
   */

  var utils = lar.utils = {};

  /**
   * lar basic operations namespace
   * 
   * @api public
   */

  var ops = lar.ops = {};

  /**
   * Model
   * 
   * @constructor
   * @param {Array} vertices array of arrays of vertices coordinate
   * @param {Array} cells array of arrays of C_d0 cells as vertices index
   * @api public
   */

  var Model = 
  lar.Model = function () {
    var args = argue({vertices: Array, cells: [Array, null]}, arguments);

    this.vertices = args.vertices;
    if (args.cells !== null && args.cells.length > 0) {
      this.empty = false;
      this.cells = args.cells;
    } else {
      this.empty = true;
    }
  };

  /**
   * isEmpty
   * Test if the model is empty
   * (e.g. is obtained as the boundary of a boundary).
   * 
   * @api public
   */

  lar.Model.prototype.isEmpty = function () {
    return this.empty;
  };
}(this));