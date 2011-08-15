// (c) Wouter van Joolingen, University of Twente
// This work is made available under the GNU Lesser General Public License
// You may copy distribute, contribute or modify this code, under the condition that you leave this copyright message intact

//This file contains the computational tree definition, needed for the computational heart of the modeling code.
//Each node represents a computation and the model as a whole is built as a set of equation nodes.


var EqNode, BinaryExpressionNode, ConstantNode, ConditionalExpressionNode, VariableNode, EquationNode, UnaryExpressionNode, Matrix, DataStore;

function initEquations() {

//Base class for all nodes
EqNode = new JS.Class({
	initialize: function () {
	},
	
	asXML: function () {
		return "<equation>"+ this.prettyPrint() + "</equation>";
	},
	
	compute: function () {
		return 0;
	},

	prettyPrint: function () {
	}
});


//binary expressions, e.g. x * y
BinaryExpressionNode = new JS.Class(EqNode, {
	initialize: function(left, right, op) {
		this.left = left;
		this.right = right;
		this.setOperator(op);
	},
	
	compute: function() {
		var lft = this.left.compute();
		var rgt = this.right.compute();
		return this.computeBlock(lft, rgt);
	},
	
	setLeft: function(aNode) {
		this.left = aNode;
	},
	
	setRight: function(aNode) {
		this.right = aNode;
	},
	
	setOperator: function(aString) {
		this.operator = aString;
		this.setComputeBlock();
	},
	
	prettyPrint: function () {
		return this.left.prettyPrint() + this.operator + this.right.prettyPrint();
	},
	
	setComputeBlock: function () {
		switch (this.operator) {
			case 'min':
				this.computeBlock = function (l,r) { if (l<r) {return l;} else {return r;}};
				break;
			case 'max':
				this.computeBlock = function (l,r) { if (l>r) {return l;} else {return r;}};
				break;
			case '*':
				this.computeBlock = function (l,r) { return l*r;};
				break;
			case '+':
				this.computeBlock = function (l,r) { return parseFloat(l)+parseFloat(r);};
				break;
			case '/':
				this.computeBlock = function (l,r) { return l/r;};
				break;
			case '-':
				this.computeBlock = function (l,r) { return l-r;};
				break;
			case '^':
				this.computeBlock = function (l,r) { return Math.pow(l,r);};
				break;
			case 'greater':
				this.computeBlock = function (l,r) { return (l>r)};
				break;				
			default:
				this.computeBlock = function (l,r) { return eval (l.toString() + this.operator + r.toString())};
				break;
		}
	}
});


//Unary expressions, e.g. sin x
UnaryExpressionNode = new JS.Class(EqNode, {
	initialize: function(fn, argument) {
		this.setFunction(fn);
		this.setArgument(argument);
	},
	
	compute: function() {
		var arg = this.argument.compute();
		return this.computeBlock(arg);
	},
	
	setArgument: function(aNode) {
		this.argument = aNode;
	},
	
	setFunction: function(aString) {
		this.fn = aString;
		this.setComputeBlock();
	},
	
	prettyPrint: function () {
		return this.fn + "(" + this.argument.prettyPrint() + ")";
	},
	
	setComputeBlock: function () {
		switch (this.fn) {
			case 'sin':
				this.computeBlock = function (a) { return Math.sin(a); };
				break;
			case 'cos':
				this.computeBlock = function (a) { return Math.cos(a); };
				break;
			case 'tan':
				this.computeBlock = function (a) { return Math.tan(a); };
				break;
			case 'sqrt':
				this.computeBlock = function (a) { return Math.sqrt(a); };
				break;
			case 'abs':	
				this.computeBlock = function (a) { return Math.abs(a); };
				break;
			case 'exp':	
				this.computeBlock = function (a) { return Math.exp(a); };
				break;
			case 'arcsin':	
				this.computeBlock = function (a) { return Math.asin(a); };
				break;
			case 'arccos':	
				this.computeBlock = function (a) { return Math.acos(a); };
				break;
			case 'arctan':	
				this.computeBlock = function (a) { return Math.atan(a); };
				break;
			case 'round':	
				this.computeBlock = function (a) { return Math.round(a); };
				break;
			case '-.':
				this.computeBlock = function (a) { return - a; };
				break;				
			default:
				this.computeBlock = function (a) { return eval (this.fn.toString() + "(" + a.toString() + ")"); };
				break;
		}
	}
});

//constant nodes e.g. 3
ConstantNode = new JS.Class(EqNode, {
	initialize: function (value) {
		this.value = value;
	},
	
	compute: function () {
		return this.value;
	},
	
	prettyPrint: function () {
		return this.value.toString();
	}
});


//variable nodes e.g. x
VariableNode = new JS.Class(EqNode, {
	initialize: function (name, value, kind, externalName, pair) {
		this.name = name;
		this.value = parseFloat(value);
		if (!kind) {
			this.kind = 'input';
		} else {
			this.kind = kind;
		}
		if (!externalName) {
			this.externalName = name
		} else {
			this.externalName = externalName;
		}
		if (pair) {
			this.pair = pair;
		}
	},
	
	compute: function () {
		return this.value;
	},
	
	setValue: function (value) {
		this.value = parseFloat(value);
		if (this.updater != undefined) {
			this.updater();
		}
	},
	
	prettyPrint: function () {
		return this.name.toString();
	},
	
	htmlInput: function (modelName) {
		var str = this.externalName + ': <input type="text" id="' + this.name + '"value="'+ this.value + '"';
		if (this.kind =='output') {
			str += ' readonly="readonly"><br />';
		} else {
			str += ' onchange="' + modelName + '.getExtVariable('+ "'" +this.name + "'" + ').setValue(this.value)"><br />';
		}
		return str;
	}
	
});

ConditionalExpressionNode = new JS.Class(EqNode, {
	initialize: function(ifPart, thenPart, elsePart) {
		this.ifPart = ifPart;
		this.thenPart = thenPart;
		this.elsePart = elsePart;
	},
	
	compute: function()
	{
		if (this.ifPart.compute()) {
			return this.thenPart.compute();
		} else {
			return this.elsePart.compute();
		}	
	},
	
	prettyPrint: function () {
		return "if "+ ifPart.prettyPrint() + " then " + thenPart.prettyPrint() + " else " + elsePart.prettyPrint() + " endif";
	}
});

//Equation assignmets output = 3
EquationNode = new JS.Class(EqNode, {
	initialize: function(assignment, expression) {
		this.assignment = assignment;
		this.expression = expression;
	},
	
	compute: function() {
		var val = this.expression.compute()
		this.assignment.setValue(val);
		return val;
	},
	
	prettyPrint: function () {
		return this.assignment.toString() + ' = ' + this.expression.toString();
	}
});


//Supportive class for matrix computations.
Matrix = new JS.Class({
	initialize: function (numRows, numColumns) {
		this.data = new Array(numRows*numColumns);
		this.rows = numRows;
		this.columns = numColumns;
	},
	
	setData: function(anArray) {
		//a quick way to replace the data. Responsibility (e.g. size reqauirements) is with the programmer.
		this.data=anArray;
	},
	
	cloneSize: function () {
		//returns a new, empty matrix with the same size
		return new Matrix(this.rows, this.columns);
	},
	
	elementAt: function(row, column) {
		return this.data[(row-1)*this.columns+ column - 1];
	},
	
	elementBasicAt: function(i) {
		//sometimes it is faster to just address the i'th element of the array
		return this.data[i];
	},
	
	setElementAt: function(row, column, value) {
		this.data[(row-1)*this.columns+column - 1] = value;
	},
	
	setElementBasicAt: function (i, value) {
		this.data[i] = value;
	},
	
	timesConstant: function(constant) {
		var newM = this.cloneSize();
		for (var i = 0; i < this.data.length; i++) {
			newM.setElementBasicAt(i, constant* this.data[i]);
		}
	},
	
	times: function (aMatrix) {
		//matrix multiplication this matrix is on the left
		if (this.columns != aMatrix.rows) {
			console.log("Unequal matrix sizes in matrix multplication");
			return null;
		}
		var newM = new Matrix(this.rows, aMatrix.columns);
		for (i=1; i<= this.rows; i++) {
			for (j=1; j<=aMatrix.columns; j++) {
				var sum = 0;
				for (k=1; k<=this.columns; k++) {
					sum += this.elementAt(i,k)*aMatrix.elementAt(k,j);
				}
				newM.setElementAt(i,j,sum);
			}
		}
		return newM;
	},
	
	isColumnVector: function () {
		return this.columns == 1;
	},
	
	isRowVector: function () {
		return this.rows == 1;	
	},
	
	transpose: function() {
		//returns a new matrix with the elements transposed
		var newM = new Matrix(this.columns, this.rows);
		for (i=1; i<= this.rows; i++) {
			for (j=1; j<=this.columns; j++) {		
				newM.setElementAt(j,i, this.elementAt(i,j));
			}
		}
		return newM;
	},
	
	asHTMLTable: function () {
		str = "<table>\n";
		for (i=1; i<= this.rows; i++) {
			str+= "\t<tr>";
			for (j=1; j<=this.columns; j++) {
				str+="<td>"+this.elementAt(i,j)+"</td>";
			}
			str+="</tr>\n";
		}
		str += "</table>\n";
		return str;
	}
});	

DataStore = new JS.Class({
	initialize : function (arrayOfVariables) {
		this.variables= new Array();
		if (arrayOfVariables) {
			for (var vName in arrayOfVariables) {
				var v = arrayOfVariables[vName];
				var newV = new VariableNode(v.name, v.value, v.kind, v.externalName + "Copy" , v.pair);
				//newV.updater = function () { v.value = newV.value; console.log("My updater " + v.name) }
				this.variables[vName] = newV;
			}			
		}
		this.originalVariables = arrayOfVariables;	
	},
	
	copyFrom: function () {
		for (var vName in this.variables) {
			this.variables[vName].value = this.originalVariables[vName].value;
		}	
	},

	copyTo: function () {
		for (var vName in this.variables) {
			this.originalVariables[vName].value = this.variables[vName].value;
		}	
	}	
	
});
	
}; //init


