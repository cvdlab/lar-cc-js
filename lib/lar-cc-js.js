!(function (exports) {

	var Args = require('args-js');
	var numbers = require('numbers');
	var sets = require('simplesets');
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

	var max = Math.max;
	var min = Math.min;
	var abs = Math.abs;

  

  /**
   * Utility function
   */

	var utils = lar.utils = {};

	var brcToCoo = lar.utils.brcToCoo = function() {
		var args = Args([ {triples: Args.ARRAY | Args.Required} ], arguments);

		var rowList = [];
		var colList = [];
		var datList = [];
		var maxCol = 0;

		args.triples.forEach(function(el, idx) {
			el.forEach(function(innerEl) {
				rowList.push(idx);
				colList.push(innerEl);
				datList.push(1);
				maxCol = max(maxCol, innerEl);
			});
		});

		return new mtx.CooMatrix(rowList, colList, datList, rowList[rowList.length-1], maxCol);
	};

	var zeroChain = lar.utils.zeroChain = function() {
		var args = Args([ {cells: Args.ARRAY | Args.Required} ], arguments);
	};

	var totalChain = lar.utils.totalChain = function() {
		var args = Args([ {cells: Args.ARRAY | Args.Required} ], arguments);

		var newCells = [];
		cells.forEach(function(el) { newCells.push([0]); } )

		return brcToCoo(newCells).toCsr();
	};

  /**
   * lar basic operations namespace
   * 
   * @api public
   */

	var ops = lar.ops = {};

	var boundaryFilter = lar.ops.boundaryFilter = function() {
		var args = Args([ {csrMtx:     Args.OBJECT  | Args.Required, _type: CsrMatrix} ], arguments); 

		var maxData = [];
		for(var i = 0; i < args.csrMtx.getRowCount(); ++i) {
			maxData.push( numbers.basic.max(args.csrMtx.getRow(i)) );
		}

		var cooMtx = args.csrMtx.toCoo();
		var resRow = [];
		var resCol = [];
		var resDta = [];

		for(var i = 0; i < cooMtx.getDataList().length; ++i) {
			if (cooMtx.getDataList()[i] == maxData[cooMtx.getRowList()[i]] ) {
				resRow.push(cooMtx.getRowList()[i]);
				resCol.push(cooMtx.getColumnList()[i]);
				resDta.push(1);
			}
		}

		return (new mtx.CooMatrix(resRow, resCol, resDta, args.csrMtx.getRowCount(), args.csrMtx.getColCount())).toCsr();
	};

	var predicateFilter = lar.ops.boundaryFilter = function() {
		var args = Args([ {csrMtx: Args.OBJECT | Args.Required, _type: CsrMatrix},
						  {pred: Args.FUNCTION | Args.Required} ], arguments);

		var cooMtx = args.csrMtx.toCoo();
		var resRow = [];
		var resCol = [];
		var resDta = [];

		for(var i = 0; i < cooMtx.getDataList().length; ++i) {
			if ( args.pred( cooMtx.getDataList()[i] ) ) {
				resRow.push( cooMtx.getRowList()[i] );
				resCol.push( cooMtx.getColumnList()[i] );
				resDta.push( cooMtx.getDataList()[i] );
			}
		}

		var retCoo = (new mtx.CooMatrix(resRow, resCol, resDta, args.csrMtx.getRowCount(), args.csrMtx.getColCount())).transpose();
		return retCoo.toCsr();
	};

	var boundary = lar.utils.boundary = function() {
		var args = Args([ {cells: Args.ARRAY | Args.Required},
						{facets: Args.ARRAY | Args.Required} ], arguments);

		var csrCV = brcToCoo(args.cells).toCsr();
		var csrFV = brcToCoo(args.facets).toCsr();
		var csrFC = csrFV.multiply( csrCV.transpose() );
		
		return boundaryFilter(csrFC);
	};

	var coboundary = lar.utils.coboundary = function() {
		var args = Args([ {cells: Args.ARRAY | Args.Required},
						{facets: Args.ARRAY | Args.Required} ], arguments);

		return boundary(args.cells, args.facets).transpose();
	};

	var boundaryCells = lar.utils.boundaryCells = function() {
		var args = Args([ {cells: Args.ARRAY | Args.Required},
						{facets: Args.ARRAY | Args.Required} ], arguments);

		var boundaryMat = boundary(args.cells,args.facets);
		var chainMat = totalChain(args.cells);
		var boundChain = (boundaryMat.multiply(chainMat)).toCoo();

		var resDta = [];

		for(var i = 0; i < cooMtx.getDataList().length; ++i) {
			if ( (cooMtx.getDataList()[i] % 2) !== 0 ) {
				resDta.push( i );
			}
		}

		return resDta;
	};

	var signedSimplicialBoundary = lar.utils.signedSimplicialBoundary = function() {
		var args = Args([
						{CV: Args.ARRAY | Args.Required},
						{FV: Args.ARRAY | Args.Required} ], arguments);

		var cooBoundary = boundary(args.CV,args.FV).toCoo();
		
		var pairs = [];
		cooBoundary.getDataList().forEach(function(el,idx) {
			if (el != 0) {
				pairs.push([cooBoundary.getRowList()[idx], cooBoundary.getColumnList()[idx]]);
			}
		});

		var vertLists = [];
		pairs.forEach(function(el, idx) {
			vertLists.push([FV[el[0]], CV[el[1]]]);
		});

		var missingVertIndices = [];
		vertLists.forEach(function(el, idx){
			 var a0 = ((new sets.Set(el[1])).difference(new set.Set(el[0]));
			 a0 = a0.array();
			 missingVertIndices(el[1].indexOf(a0[0]));
		});

		var faceSigns = [];
		missingVertIndices.forEach(function(el) {
			faceSigns.push((el % 2) ? 1.0 : -1.0);
		});
		
		var rowCols = new DenseMatrix(pairs, pairs.length, pairs[0].length).transpose();
   		return new CsrMatrix( /*rowCols?? ,*/faceSigns);
	};	

	var signedBoundaryCells = lar.utils.signedBoundaryCells = function() { 
		var args = Args([
				{V: Args.ARRAY | Args.Required},
				{CV: Args.ARRAY | Args.Required},
				{FV: Args.ARRAY | Args.Required} ], arguments);
   		
   		var csrSignedBoundaryMat = signedSimplicialBoundary(args.CV,args.FV);

   		var csrTotalChain = totalChain(args.CV)
   		var csrBoundaryChain = csrSignedBoundaryMat.multiply(csrTotalChain);
   		var cooCells = csrBoundaryChain.toCoo();
   
   		var boundaryCells = [];
   		cooCells.getDataList().forEach(function(el,idx)) {
   			if (Math.abs(el) == 1) {
   				boundaryCells.push(~~(cooCells.getRowList()[idx] * cooCells.getDataList()[idx]));
   			}
   		});
   
   		var boundaryCocells = [];
   		boundaryCells.forEach(function(el,idx) {
   			boundaryCocells = boundaryCocells.concat(csrSignedBoundaryMat[Math.abs(idx)].toCoo().getDataList());
   		});

   		var boundaryCofaceMats = [];
   		boundaryCocells.forEach(function(el) {
   			var pushableV = [];
   			args.CV[el].forEach(function(vel) {
   				pushableV.push( args.V[vel].concat([1]) );
   			});
   			boundaryCofaceMats.push( new DenseMatrix(pushableV) );
   		});

   		// determinante
   		var boundaryCofaceSigns = []; /*AA(SIGN)(AA(np.linalg.det)(boundaryCofaceMats))*/
   		boundaryCofaceMats.forEach(function(mat) {
   			boundaryCofaceSigns.push( mat.determinant() > 0 ? 1 : -1 );
   		});

   		var orientedBoundaryCells = [];
   		boundaryCells.forEach(function(el,idx) {
   			orientedBoundaryCells.push(el * boundaryCofaceSigns[idx]);
   		});

		return orientedBoundaryCells;
	}; 

  /**
   * Model
   * 
   * @constructor
   * @param {Array} vertices array of arrays of vertices coordinate
   * @param {Array} cells array of arrays of C_d0 cells as vertices index
   * @api public
   */

	var Model = lar.Model = function () {
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