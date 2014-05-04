!(function (exports) {

  var Args = require('args-js');
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

/*

def csrBoundaryFilter(CSRm, facetLengths):
  maxs = [max(CSRm[k].data) for k in xrange(CSRm.shape[0])]
  inputShape = CSRm.shape

  coo = CSRm.tocoo()

  row = [] # np.array([]).astype(np.int32);
  col = [] # np.array([]).astype(np.int32);
    # data = [] # np.array([]).astype(np.int32);

  k = 0
  while (k < len(coo.data)):      
    if coo.data[k] == maxs[coo.row[k]]:
      row.append(coo.row[k])
      col.append(coo.col[k])
    k += 1
    
  data = np.ones(len(col),dtype=np.int32);
  mtx = coo_matrix( (data, ( np.array(row).astype(np.int32), np.array(col).astype(np.int32) )), shape=inputShape)

  out = mtx.tocsr()
  return out

def csrPredFilter(CSRm, pred):
   # can be done in parallel (by rows)
   coo = CSRm.tocoo()
   triples = [[row,col,val] for row,col,val 
            in zip(coo.row,coo.col,coo.data) if pred(val)]
   i, j, data = TRANS(triples)
   CSRm = scipy.sparse.coo_matrix((data,(i,j)),CSRm.shape).tocsr()
   return CSRm

def boundary(cells,facets):
    csrCV = csrCreate(cells)
    csrFV = csrCreate(facets)
    csrFC = matrixProduct(csrFV, csrTranspose(csrCV))
    facetLengths = [csrCell.getnnz() for csrCell in csrCV]
    return csrBoundaryFilter(csrFC,facetLengths)

def coboundary(cells,facets):
    Boundary = boundary(cells,facets)
    return csrTranspose(Boundary)

*/  

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
    var args = Args([
        {vertices:    Args.ARRAY | Args.Required},
        {cells:     Args.ARRAY | Args.Optional, _default: null}
      ], arguments);    

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