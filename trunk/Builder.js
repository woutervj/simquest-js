var Builder;

function initBuilder () {
Builder = new JS.Class({
	initialize: function (filename) {
		if (window.XMLHttpRequest)
		{
			xhttp=new XMLHttpRequest();
		} else {
		// for IE 5/6
			xhttp=new ActiveXObject("Microsoft.XMLHTTP");
		}
		xhttp.open("GET",filename,false);
		xhttp.send();
		this.xmlDoc=xhttp.responseXML;
		this.model = new Model("xmlModel");
		this.interfaces = new Array();
	},
	
	buildModel: function () {
		this.privateVars = new Array();
		var modelNode = this.xmlDoc.getElementsByTagName("model")[0];
		this.processModel(modelNode);
		this.model.postBuild();
		return this.model;
	},
	
	processModel: function (aNode) {
		for (var i= 0; i < aNode.childNodes.length; i++) {
			var nd = aNode.childNodes[i];
			switch (nd.nodeName) {
				case 'variables':
					this.processModelVariables(nd);
					break;
				
				case 'computationalModel':
					this.processCode(nd.childNodes[1]);
					break;

				case 'header':
				//ignore the header for now
				default:
					break
				
			}
		}		
	},
	
	processModelVariables: function(aNode) {
		for (var i=0; i<aNode.childNodes.length; i++) {
			var nd = aNode.childNodes[i];
			if (nd.nodeName == 'modelVariable') {
				var varName = '', varValue = 0, varExtName = '', varKind = 'input', varPair;
				for (var j=0; j<nd.childNodes.length; j++) {
					var vd = nd.childNodes[j];
					switch (vd.nodeName) {
						case 'name':
							varName = vd.childNodes[0].nodeValue;
							break;
						case 'value':
							varValue = vd.childNodes[0].nodeValue;
							break;
						case 'externalName':
							varExtName = vd.childNodes[0].nodeValue;
							break;
						case 'kind':
							varKind = vd.childNodes[0].nodeValue;
							break;
						case 'pair':
							varPair = vd.childNodes[0].nodeValue;
							break;
						default:
							break
					}
				}
				if (varName) {
					var vNode = this.model.addVariable(new VariableNode(varName, varValue, varKind, varExtName, varPair));
				}
			}
		}
	},
	
	processCode: function(aNode) {
		for (var i= 0; i < aNode.childNodes.length; i++) {
			var nd = aNode.childNodes[i];
			if (nd.nodeName =='equation') {
				this.processEquation(nd);
			}
		}
	},
	
	processEquation: function(aNode) {
		var left = this.processExpressionVariable(aNode.childNodes[1]);
		var right = this.processExpression(aNode.childNodes[3]);
		this.model.addEquation(new EquationNode(left, right));
	}, 
	
	processExpression: function(aNode) {
		switch (aNode.nodeName) {
			case 'operator':
				return this.processOperator(aNode);
			case 'function':
				return this.processFunction(aNode);
			case 'variable':
				return this.processExpressionVariable(aNode);
			case 'literal':
				return this.processLiteral(aNode);
			default:
				return new ConstantNode(0);
				break;
		}
	},
	
	processOperator: function(anOperatorNode) {
		var op = anOperatorNode.getAttribute("name");
		var left = this.processExpression(anOperatorNode.childNodes[1]);
		if (anOperatorNode.childNodes[3] == undefined) {
			return new UnaryExpressionNode(op, left);
		} else {
			var right = this.processExpression(anOperatorNode.childNodes[3]);
			return new BinaryExpressionNode(left, right, op);
		}
	},
	
	processFunction: function(aFunctionNode) {
		var func = aFunctionNode.getAttribute("name");
		var arg = this.processExpression(aFunctionNode.childNodes[1]);
		return new UnaryExpressionNode(func, arg);
	},
	
	processVariable: function(aVariableNode) {
		var varName = aVariableNode.childNodes[0].nodeValue;
		if (!(nd = this.model.getExtVariable(varName))) {
			if (!(nd=this.privateVars[varName])) {
				nd = new VariableNode(varName, 0);
				this.privateVars[varName] = nd;
			} 
		}
		return nd;
	},

	processExpressionVariable: function(aVariableNode) {
		var varName = aVariableNode.childNodes[0].nodeValue;
		if (!(nd = this.model.getVariable(varName))) {
			if (!(nd=this.privateVars[varName])) {
				nd = new VariableNode(varName, 0);
				this.privateVars[varName] = nd;
			} 
		}
		return nd;
	},
	
	processLiteral: function(aLiteralNode) {
		var cst = aLiteralNode.childNodes[0].nodeValue;
		return new ConstantNode(cst);
	},
		
	buildInterfaces: function () {
		var interfaces = this.xmlDoc.getElementsByTagName('interfaces')[0];
		var newI;
		for (var i=0; i<interfaces.childNodes.length; i++) {
			nd = interfaces.childNodes[i];
			if (nd.nodeName == 'interface') {
				newI  = this.buildInterface(nd);
				newI.model = this.model;
				this.model.addInterface(newI);
				if (newI) {this.interfaces.push(newI);}
			}
		}
		return this.interfaces;
	},
	
	buildInterface: function (node) {
		newI = new Interface();
		for (var i=0; i<node.childNodes.length; i++) {
			nd = node.childNodes[i];
			switch (nd.nodeName) {
				case 'header':
					this.processHeader(nd, newI);
					break;
				case 'placement':
					var coords = this.processPlacement(nd);
					newI.placement(coords);
					break;
				case 'widgets':
					this.processWidgets(nd, newI);
					break;
				default:
					//empty text node or unknown: ignore
					break;
			}	
		}
		return newI;
	},
	
	processHeader: function (node, newI)	{
		for (var i=0; i<node.childNodes.length; i++) {
			nd = node.childNodes[i];
			switch (nd.nodeName) {
				case 'name':
					newI.name = nd.childNodes[0].nodeValue;
					break;
				default:
					//ignore all other header information
					break;
			}	
		}
	},
	
	processPlacement: function (node) {
		var p1, p2;
		for (var i=0; i<node.childNodes.length; i++) {
			nd = node.childNodes[i];
			switch (nd.nodeName) {
				case 'origin':
					p1 = this.processPoint(nd);
					break;
				case 'corner':
					p2 = this.processPoint(nd);
					break;
				default:
					break;
			}
		}
		var place = new Array();
		place['left'] = p1['x'];
		place['top'] = p1['y'];
		place['right'] = p2['x'];
		place['bottom'] = p2['y'];
		return place;
	},
	
	processTextOrExpression : function (node) {
		//the node is either text (for a value) or an expressionNode
		if (node.childNodes.length == 1) {
			//text
			return node.childNodes[0].nodeValue;
		} else {
			return this.processExpression(node)
		}
	},
	
	processPoint: function (node) {
		var p = new Array();
		for (var i=0; i<node.childNodes.length; i++) {
			nd = node.childNodes[i];
			switch (nd.nodeName) {
				case 'x':
					p['x'] = this.processTextOrExpression(nd);
					break;
				case 'y':
					p['y'] = this.processTextOrExpression(nd);
				default:
					break;
			}
		}
		return p;
	},
	
	processWidgets: function(node, newI) {
		for (var i=0; i<node.childNodes.length; i++) {
			nd = node.childNodes[i];
			switch (nd.nodeName) {
				case 'widget':
					var wdgt = this.processWidget(nd);
					if (wdgt) {	newI.addElement(wdgt); }
					break;
				default:
					break;
			}
		}
	},
	
	processWidget: function(node){
		var widget, coords, font, border, color;
		for (var i=0; i<node.childNodes.length; i++) {
			nd = node.childNodes[i];
			switch (nd.nodeName) {
				case 'placement':
					coords = this.processPlacement(nd);
					break;
				case 'font':
					font = this.processDefaultNode(nd);
					break;
				case 'border':
					border = this.processDefaultNode(nd);
					break;
				case 'color':
					color = this.processDefaultNode(nd);
					break;	
					
				// these were the properties, now for the wiget types	
					
				case 'actionButton':
					widget = this.processActionButton(nd);
					break;
				case 'numeric':
					widget = this.processNumericField(nd);
					break
				case 'label':
					widget = this.processLabel(nd);
					break;
				default:
					//we do not handle the remaining widgets yet, the list above may grow!
					break;
			}
		}
		if (!widget) return 0;
		widget.placement(coords);
		widget.font(font);
		widget.border(border);
		widget.color(color);
		return widget;
	},
	
	processDefaultNode: function (node) {
		var a = new Array();
		for (var i=0; i<node.childNodes.length; i++) {
			nd = node.childNodes[i];
			if (nd.nodeName!='#text') {
				a[nd.nodeName] = nd.childNodes[0].nodeValue;
			}			
		}
		return a;
	},
	
	
	processActionButton: function (node) {
		var widget = new ActionButton()
		for (var i=0; i<node.childNodes.length; i++) {
			nd = node.childNodes[i];
			switch (nd.nodeName) {
				case 'string':
					widget.label = nd.childNodes[0].nodeValue;
					break;
				case 'action':
					widget.action = nd.childNodes[0].nodeValue;
					break;
				default:
					break;
			}
		}
		return widget;
	},
	
	processNumericField: function (node) {
		var widget = new NumericField()
		for (var i=0; i<node.childNodes.length; i++) {
			nd = node.childNodes[i];
			switch (nd.nodeName) {
				case 'variable':
					widget.variable = this.model.getExtVariable(nd.childNodes[0].nodeValue);
					break;
				case 'format':
					widget.format = nd.childNodes[0].nodeValue;
					break;
				default:
					break;
			}
		}
		return widget;
	},
	
	processLabel: function (node) {
		var widget = new Label();
		for (var i=0; i<node.childNodes.length; i++) {
			nd = node.childNodes[i];
			switch (nd.nodeName) {
				case 'string':
					widget.label = nd.childNodes[0].nodeValue;
					break;
				default:
					break;
			}
		}
		return widget;
	}

});

}