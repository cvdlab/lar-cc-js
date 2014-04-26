
!(function (exports) {

	var argue = require('argue');
	var numbers = require('numbers');

	//
	var newFilledArray = function(len, val) {
	    var a = [];
	    while(len--){
	        a.push(val);
	    }
	    return a;
	};	

	// A basic AbstractMatrix struct
	var AbstractMatrix = exports.AbstractMatrix = function AbstractMatrix() {
		args = __({rows: [Number, 0], columns: [Number, 0]}, arguments);

		this.rows = args.rows;
		this.columns = args.columns;
	};

	AbstractMatrix.prototype.getRowCount = function() {
		return this.rows;
	};

	AbstractMatrix.prototype.getColumnCount = function() {
		return this.columns;
	};

	AbstractMatrix.prototype.canMultiply = function() {
		args = __({otherMatrix: AbstractMatrix}, arguments);

		return ( this.getColumnCount() == otherMatrix.getRowCount() );
	};

	AbstractMatrix.prototype.multiply = function () {
		throw "Abstract method";
	};

	AbstractMatrix.prototype.transpose = function () {
		throw "Abstract method";
	};	

	// DenseMatrix
	var DenseMatrix = exports.DenseMatrix = function DenseMatrix() {
		args = __({rows: [Number, 0], columns: [Number, 0], data: Array}, arguments);

		this.data = data;
		AbstractMatrix.call(this, args.rows, args.columns);
	};

	DenseMatrix.prototype = new AbstractMatrix();
	DenseMatrix.prototype.constructor = DenseMatrix;

	DenseMatrix.prototype.getData = function() {
		return this.data;
	};

	DenseMatrix.prototype.multiply = function() {
		args = __({otherMatrix: DenseMatrix}, arguments);

		if ( !this.canMultiply(args.otherMatrix) ) {
			throw "Matrix dimension error";
		}

		return new DenseMatrix( this.getRowCount(), otherMatrix.getColumnCount(), numbers.matrix.multiply(this.getData(),otherMatrix.getData()) );
	};

	DenseMatrix.prototype.transpose = function() {
		return new DenseMatrix( this.getColumnCount(), this.getRowCount(), numbers.matrix.transpose(this.getData()) )
	};

	// AbstractSparseMatrix
	var AbstractSparseMatrix = exports.AbstractSparseMatrix = function AbstractSparseMatrix() {
		args = __({rows: [Number, 0], columns: [Number, 0], nnz: [Number, 0]}, arguments);

		this.nnz = nnz;
		AbstractMatrix.call(this, args.rows, args.columns);
	};

	AbstractSparseMatrix.prototype = new AbstractMatrix();
	AbstractSparseMatrix.prototype.constructor = AbstractSparseMatrix;

	AbstractSparseMatrix.prototype.getNNZ = function() {
		return this.nnz;
	};

	AbstractSparseMatrix.prototype.toDense = function() {
		throw "Abstract method";
	};

	// CsrMatrix
	var CsrMatrix = exports.CsrMatrix = function CsrMatrix() {
		args = __({rowptr: Array, coldata: Array, data: Array, rows: [Number, -1], columns: [Number, -1]}, arguments);

		this.rowptr = args.rowptr;
		this.coldata = args.coldata;
		this.data = args.data;

		var rows = Math.max(args.rows, this.rowptr.length - 1);
		var columns = (args.columns != -1) ? args.columns : numbers.basic.max(this.coldata);

		AbstractSparseMatrix.call(this, rows, columns, this.data.length);
	};

	CsrMatrix.prototype = new AbstractSparseMatrix();
	CsrMatrix.prototype.constructor = CsrMatrix;

	CsrMatrix.prototype.getRowPointers = function() {
		return this.rowptr;
	};
	
	CsrMatrix.prototype.getColumnData = function() {
		return this.coldata;
	};
	
	CsrMatrix.prototype.getData = function() {
		return this.data;
	};

	CsrMatrix.prototype.toDense = function() {
		var rowArray = new Array(this.getRowCount());

		for(var i = 0; i < (this.getRowPointers().length - 1); i++) {
			var columnAdd = newFilledArray(this.getColumnCount(), 0);
			for(var k = this.getRowPointers()[i]; k < this.getRowPointers()[i+1]; k++ ) {
				columnAdd[ this.getColumnIndices()[k] ] = this.getData()[k];
			}
			rowArray[i] = columnAdd;
		}

		return new DenseMatrix(this.getRowCount(), this.getColumnCount(), rowArray);
	};	

	CsrMatrix.prototype.multiply = function() {
		args = __({otherMatrix: CsrMatrix}, arguments);

		if ( !this.canMultiply(args.otherMatrix) ) {
			throw "Matrix dimension error";
		}

		var argMatrix = args.otherMatrix.transpose();

		var newRowPtr = [0];
		var newColIndices = [];
		var newData = [];

		for (var i = 0; i < this.getRowCount(); i++) {
			var colAdd = 0;

			for (var j = 0; j < argMatrix.getRowCount(); j++) {

				var ArowCur = this.getRowPointers()[i];
				var ArowEnd = this.getRowPointers()[i + 1];
				var curPosA = ArowCur;

				var BrowCur = argMatrix.getRowPointers()[j];
				var BrowEnd = argMatrix.getRowPointers()[j + 1];
				var curPosB = BrowCur;

				var AcurIdx = this.getColumnData()[ArowCur];
				var BcurIdx = argMatrix.getColdata()[BrowCur];

				var localSum = 0;

				while ((curPosA < ArowEnd) && (curPosB < BrowEnd)) {
					AcurIdx = this.getColumnData()[curPosA];
					BcurIdx = argMatrix.getColumnData()[curPosB];

					if (AcurIdx == BcurIdx) {
						localSum += this.getData()[curPosA] * argMatrix.getData()[curPosB];
						curPosA++;
						curPosB++;
					} else if (AcurIdx < BcurIdx) {
						curPosA++;
					} else {
						curPosB++;
					}
				}

				if (localSum > 0) {
					colAdd += 1;
					newColIndices.push(j);
					newData.push(localSum);
				}
			}

			newRowPtr.push(newRowPtr[i] + colAdd);
		}

		newRowPtr.push(newData.length);

		return new CsrMatrix(newRowPtr, newColIndices, newData, this.getRowCount(), args.otherMatrix.getColumnCount());
	};

	CsrMatrix.prototype.transpose = function() {
		var f_transposeEnum = function(inputArray, maxN, outputArray) {
			if (maxN === 0) {
				return;
			}

			outputArray[0] = 0;
			for (var i = 1; i <= maxN; i++) {
				outputArray[i] = outputArray[i - 1] + inputArray[i - 1];
			}
		};

		// lookup
		var m = this.getRowCount();
		var n = this.getColumnCount();
		var base = 0;

		// NNZ elements
		var nnz = this.getRowPointers()[m] - base;

		// New arrays
		var newPtr = new Array(n + 1);
		var newCol = new Array(nnz);
		var newData = new Array(nnz);
		// Create and initialize to 0
		var count_nnz = newFilledArray(n, 0);

		// Reused index
		var i = 0;

		// Count nnz per column
		for(i = 0; i < nnz; i++) {
			count_nnz[(this.getColumnIndices()[i] - base)]++;
		}

		// Create the new rowPtr
		f_transposeEnum(count_nnz, n, newPtr);

		// Copia TrowPtr in moda tale che count_nnz[i] == location in Tind, Tval
		for(i = 0; i < n; i++) {
			count_nnz[i] = newPtr[i];
		}

		// Copia i valori in posizione
		for(i = 0; i < m; i++) {
			var k;
			for (k = (this.getRowPointers()[i] - base); k < (this.getRowPointers()[i+1] - base); k++ ) {
				var j = this.getColumnData()[k] - base;
				var l = count_nnz[j];

				newCol[l] = i;
				newData[l] = this.getData()[k];
				count_nnz[j]++;
			}
		}

		return new CsrMatrix(newPtr, newCol, newData, n, m);
	};

}(this));