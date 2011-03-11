var Model;

function initModel () {

Model = new JS.Class({
	initialize: function (name) {
		this.variables = new Array();
		this.equations = new Array();
		this.stateVariables = new Array();
		this.name = name;
		this.interfaces= new Array();
	},

	addInterface: function (anInterface) {
		this.interfaces.push(anInterface);
	},
	
	compute: function () {
		for (var i=0; i<this.equations.length; i++) {
			this.equations[i].compute();
		}
	},
	
	postBuild: function () {
		this.dataStore = new DataStore(this.variables); 
		this.dataStore.copyFrom();
		this.originalData =  new DataStore(this.variables); 
		this.originalData.copyFrom();
	},
	
	computeAndUpdate: function () {
		this.dataStore.copyTo();
		this.compute();
		this.update();
	},
	
	step: function(dt) {
		//euler step will add more sophisticated algorithms later
		this.dataStore.copyTo();
		this.compute();
		for (var i = 0; i<this.stateVariables.length; i++) {
			svar = this.stateVariables[i];
			var paired = this.variables[svar.pair];
			if (paired != undefined) {
				svar.setValue(this.stateVariables[i].value + paired.value * dt);
			}
		}
		if (this.timeVariable) {
			this.timeVariable.setValue(this.timeVariable.value + dt);
		}
		this.update();
	},
	
	reset: function () {
		this.originalData.copyTo();
		this.dataStore.copyFrom();
		for (var i=0; i<this.interfaces.length; i++) {
			this.interfaces[i].reset();
		}
	},
	
	addVariable: function (aVarNode) {
		this.variables[aVarNode.name] = aVarNode;
		if (aVarNode.kind == 'state') {
			this.stateVariables.push(aVarNode);
		}
		if (aVarNode.kind == 'time') {
			this.timeVariable = aVarNode;
		}
		return aVarNode;
	},

	addEquation: function (anEqNode) {
		this.equations.push(anEqNode);
		return anEqNode;
	},

	generateHTML: function () {
		var htmlString = "";
		for (vName in this.variables) {
			htmlString += this.variables[vName].htmlInput(this.name);
		}
		htmlString += '<input type="button" value="step" onclick="' + this.name + '.doCompute()">';
		htmlString += '<input type="button" value="run" onclick="' + this.name + '.run()">';
		htmlString += '<input type="button" value="stop" onclick="' + this.name + '.stop()">';
		
		return htmlString;
	},
	
	getExtVariable: function (varName) {
		if (this.dataStore == undefined) { this.postBuild(); }
		if (this.dataStore.variables[varName]) {
				return this.dataStore.variables[varName];
		} else {
			return null;
		}
	},
	
	getVariable: function (varName) {
		if (this.variables[varName]) {
				return this.variables[varName];
		} else {
			return null;
		}
	},
		
	doCompute: function () {
		if (this.timeVariable == undefined) {
			this.computeAndUpdate();
		} else {
			this.step(0.01);
		}
	},
	
	timedStep : function () {
		var mdl = this;
		window.setTimeout(function () { mdl.step(0.01); if (mdl.running) {mdl.timedStep();} }, 10); 
	},
	
	run: function () {
		this.running = true;
		this.timedStep();
	},
	
	stop: function () {
		this.running = false;
	},
	
	update: function () {
		this.dataStore.copyFrom();
		for (var i=0; i<this.interfaces.length; i++) {
			this.interfaces[i].update();
		}
	}
});



};

