!(function (exports) {

	var argue = require('arguejs');
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
		var args = argue({rows: [Number, 0], columns: [Number, 0]}, arguments);

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
		var args = argue({otherMatrix: AbstractMatrix}, arguments);

		return ( this.getColumnCount() == args.otherMatrix.getRowCount() );
	};

	AbstractMatrix.prototype.multiply = function () {
		throw "Abstract method";
	};

	AbstractMatrix.prototype.transpose = function () {
		throw "Abstract method";
	};	

	// DenseMatrix
	var DenseMatrix = exports.DenseMatrix = function DenseMatrix() {
		var args = argue({rows: [Number, 0], columns: [Number, 0], data: Array}, arguments);

		this.data = args.data;
		AbstractMatrix.call(this, args.rows, args.columns);
	};

	DenseMatrix.prototype = new AbstractMatrix();
	DenseMatrix.prototype.constructor = DenseMatrix;

	DenseMatrix.prototype.getData = function() {
		return this.data;
	};

	DenseMatrix.prototype.multiply = function() {
		var args = argue({otherMatrix: DenseMatrix}, arguments);
		var otherMatrix = args.otherMatrix;

		if ( !this.canMultiply(otherMatrix) ) {
			throw "Matrix dimension error";
		}

		return new DenseMatrix( this.getRowCount(), otherMatrix.getColumnCount(), numbers.matrix.multiply(this.getData(),otherMatrix.getData()) );
	};

	DenseMatrix.prototype.transpose = function() {
		return new DenseMatrix( this.getColumnCount(), this.getRowCount(), numbers.matrix.transpose(this.getData()) )
	};

	// AbstractSparseMatrix
	var AbstractSparseMatrix = exports.AbstractSparseMatrix = function AbstractSparseMatrix() {
		var args = argue({rows: [Number, 0], columns: [Number, 0], nnz: [Number, 0]}, arguments);

		this.nnz = args.nnz;
		AbstractMatrix.call(this, args.rows, args.columns);
	};

	AbstractSparseMatrix.prototype = new AbstractMatrix();
	AbstractSparseMatrix.prototype.constructor = AbstractSparseMatrix;

	AbstractSparseMatrix.prototype.getNNZ = function() {
		return this.nnz;
	};

	AbstractSparseMatrix.prototype.toCsr = function() {
		throw "Abstract method";
	};

	AbstractSparseMatrix.prototype.toCoo = function() {
		throw "Abstract method";
	};

	AbstractSparseMatrix.prototype.toDense = function() {
		throw "Abstract method";
	};

	// CooMatrix
	var CooMatrix = exports.CooMatrix = function CooMatrix() {
		var args = argue({rowlist: Array, collist: Array, datalist: Array, rows: [Number, -1], columns: [Number, -1]}, arguments);

		if ((args.rowlist.length != args.collist.length) || (args.collist.length != args.datalist.length)) {
			throw "Different sizes for arguments length";
		}

		this.rowlist = args.rowlist;
		this.collist = args.collist;
		this.datalist = args.datalist;

		var rows = (args.rows != -1) ? args.rows : numbers.basic.max(this.rowlist);
		var columns = (args.columns != -1) ? args.columns : numbers.basic.max(this.collist);

		AbstractSparseMatrix.call(this, rows, columns, this.datalist.length);
	};

	CooMatrix.prototype = new AbstractSparseMatrix();
	CooMatrix.prototype.constructor = CooMatrix;

	CooMatrix.prototype.getRowList = function() {
		return this.rowlist;
	};
	
	CooMatrix.prototype.getColumnList = function() {
		return this.collist;
	};
	
	CooMatrix.prototype.getDataList = function() {
		return this.datalist;
	};

	CooMatrix.prototype.toCsr = function() {
		var rowData = [0];
		var lastElem = this.getRowList()[0];
		var count = 0;

		for(var i = 0; i < this.getRowList().length; i++) {
			if ( lastElem != this.getRowList()[i] ) {
				rowData.push( rowData[rowData.length - 1] + count );
				lastElem = this.getRowList()[i];
				count = 0;
			}

			count = count + 1;
		}

		rowData.push( rowData[rowData.length - 1] + count );

		return new CsrMatrix(rowData, this.getColumnList(), this.getDataList(), this.getRowCount(), this.getColumnCount());
	};	

	CooMatrix.prototype.toDense = function() {
		var rowArray = new Array(this.getRowCount());
		var lastRow = this.getRowList()[0];
		var columnAdd = newFilledArray(this.getColumnCount(), 0);

		for(var i = 0; i < this.getRowList().length; i++) {
			if ( lastRow != this.getRowList()[i] ) {
				rowArray[lastRow] = columnAdd;
				columnAdd = newFilledArray(this.getColumnCount(), 0);				
				lastRow = this.getRowList()[i];
			}

			columnAdd[ this.getColumnList()[i] ] = this.getDataList()[i];
		}

		// last row
		rowArray[lastRow] = columnAdd;

		return new DenseMatrix(this.getRowCount(), this.getColumnCount(), rowArray);
	};

	CooMatrix.prototype.transpose = function() {
		var swapFun = function(input, pos1, pos2) {
			var swap;

			swap = input[pos1];
	        input[pos1] = input[pos2];
	        input[pos2] = swap;
		};

		var colList = this.getColumnList().slice(0);
		var rowList = this.getRowList().slice(0);
		var dataList = this.getDataList().slice(0);

	    var shrink = 1.3;
	    
	    var i = colList.length;
	    var gap = colList.length;
	    var swapped = false;
	 
	    while ((gap > 1) || swapped) {
	        if (gap > 1) {
	            gap = Math.floor(gap / shrink);
	        }
	 
	        swapped = false;
	 
	        for (i = 0; gap + i < colList.length; ++i) {
	            if (colList[i] - colList[i + gap] > 0) {
	                swapFun(rowList, i, i + gap);
	                swapFun(colList, i, i + gap);
	                swapFun(dataList, i, i + gap);
	                swapped = true;
	            }
	        }
	    }

	    return new CooMatrix(colList, rowList, dataList, this.getColumnCount(), this.getRowCount());
	};

	CooMatrix.prototype.multiply = function() {
		var args = argue({otherMatrix: CooMatrix}, arguments);

		if ( !this.canMultiply(args.otherMatrix) ) {
			throw "Matrix dimension error";
		}

		// No native (for now) multiplication algorithm for COO * COO, fallback to CSR*CSR and then convert back
		return (this.toCsr().multiply(args.otherMatrix.toCsr())).toCoo();
	};

	// CsrMatrix
	var CsrMatrix = exports.CsrMatrix = function CsrMatrix() {
		var args = argue({rowptr: Array, coldata: Array, data: Array, rows: [Number, -1], columns: [Number, -1]}, arguments);

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

	CsrMatrix.prototype.toCoo = function() {
		var rowList = [];

		for(var i = 0; i < (this.getRowPointers().length - 1); i++) {
			for(var k = this.getRowPointers()[i]; k < this.getRowPointers()[i+1]; k++ ) {
				rowList.push(i)
			}
		}

		return new CooMatrix(rowList, this.getColumnData(), this.getData(), this.getRowCount(), this.getColumnCount());
	};	

	CsrMatrix.prototype.toDense = function() {
		var rowArray = new Array(this.getRowCount());

		for(var i = 0; i < (this.getRowPointers().length - 1); i++) {
			var columnAdd = newFilledArray(this.getColumnCount(), 0);
			for(var k = this.getRowPointers()[i]; k < this.getRowPointers()[i+1]; k++ ) {
				columnAdd[ this.getColumnData()[k] ] = this.getData()[k];
			}
			rowArray[i] = columnAdd;
		}

		return new DenseMatrix(this.getRowCount(), this.getColumnCount(), rowArray);
	};	

	CsrMatrix.prototype.multiply = function() {
		var args = argue({otherMatrix: CsrMatrix}, arguments);

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
				var BcurIdx = argMatrix.getColumnData()[BrowCur];

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
			count_nnz[(this.getColumnData()[i] - base)]++;
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