var Interface, InterfaceElement, ActionButton, NumericField, Label;


function initInterface () {
Interface = new JS.Class({
	initialize: function (model, w, h) {
		this.model = new Model();
		this.left = 0;
		this.right = 0;
		this.width = 100;
		this.height = 100;
		this.elements = new Array();
	},
	
	addElement: function (anElement) {
		this.elements.push(anElement);
	},
	
	placement: function (a) {
		this.left = a['left'];
		this.right = a['right'];
		this.top = a['top'];
		this.bottom = a['bottom'];
		this.width = this.right - this.left;
		this.height = this.bottom - this.top;
	},
	
	build: function(doc) {
		var frame = doc.createElement('iframe');
		var w = parseInt(this.width) + 20;
		var h = parseInt(this.height) + 20;		
		frame.style.width =w + "px";
		frame.style.height = h + "px";
		doc.body.appendChild(frame);
		for (i=0; i<this.elements.length; i++) {
			frame.contentDocument.body.appendChild(this.elements[i].getElement(frame.contentDocument, this.model));
		}
	},
	
	update: function () {
		for (i=0; i<this.elements.length; i++) {
			this.elements[i].update();
		}
	},
	
	reset: function () {
		for (i=0; i<this.elements.length; i++) {
			this.elements[i].reset();
		}
	}
});

InterfaceElement = new JS.Class({
	initialize: function () {
		this.updaters = new Array();
		this.resetters = new Array();
		this.left=0;
		this.right=0;
		this.top=10;
		this.bottom=10;
	},

	placement: function (a) {
		this.left = a['left'];
		this.right = a['right'];
		this.top = a['top'];
		this.bottom = a['bottom'];
		this.width = this.right - this.left;
		this.height = this.bottom - this.top;
	},
	
	font: function (font) {
		if (font) {
			this.fontFamily = font['name'];
			this.fontSize = (font['size']/14.0).toString() + "em";
			if (font['bold'] == 'true') {this.fontWeight = 'bold';} else { this.fontWeight = 'normal';} 
			if (font['italic'] == 'true') {this.fontStyle = 'italic';} else {this.fontStyle = 'normal';}
//ignore underline...			
		}
	},
	
	border: function(border) {
		if (border) {
			switch (border['borderLine']) {
				case 'simple':
					this.borderStyle = 'solid';
					this.borderWidth = 1;
					break;
				default:
					this.borderStyle = 'none';
					break;					
			}
			this.borderColor = border['borderColor'];
		}
	},
	
	color: function(color) {
		if (color) {
			this.foregroundColor = color['foreground'];
			this.backgroundColor = color['background'];
		}
	},
	
	decorate: function(element) {
		this.decoratePosition(element);
		this.decorateFont(element);
		this.decorateBorder(element);
	},
	
	decoratePosition: function (element) {
		element.style.position = 'absolute';
		element.style.left = this.left;
		element.style.width = this.width;
		element.style.top = this.top;
		element.style.height = this.height;	
	},
	
	decorateFont: function (element) {
		element.style.fontStyle = this.fontStyle;
		element.style.fontFamily = this.fontFamily;
		element.style.fontSize = this.fontSize;
		element.style.fontWeight = this.fontStyle;
	},
	
	decorateBorder: function (element) {
		element.style.borderStyle = this.borderStyle;
		element.style.borderWidth = this.borderWidth;
		element.style.borderColor = this.borderColor;	
	},
	
	update: function () {
		for (var i=0; i<this.updaters.length; i++) {
			this.updaters[i]();
		}
	},
	
	reset: function () {
		for (var i=0; i<this.resetters.length; i++) {
			this.resetters[i]();
		}
	},
	
	getElement: function (doc, model) {
		console.log("This element did not implement getElement");
		return 0; //abstract function
	}
});

ActionButton = new JS.Class(InterfaceElement, {
	initialize : function() {
		this.callSuper();
		this.label = '';
		this.action = '';
	},
	

	getElement: function (doc, model) {
		var elmt = doc.createElement('input');
		var mdl = model;
		elmt.type = 'button';
		elmt.value = this.label; 
		this.decorate(elmt);
		switch (this.action){
			case 'start':
				elmt.onclick = function () {mdl.run();};//I want this to be dynamic, not using a global variable. How to do that?
				break;
			case 'stop':
				elmt.onclick = function () {mdl.stop();};
				break;
			case 'reset':
				elmt.onclick = function () {mdl.reset();};
				break;
			default:
				elmt.onclick = function () {alert("This button has no assigned action");};
				break;
		}
		return elmt;
	}
});

NumericField = new JS.Class(InterfaceElement, {
	initialize: function () {
		this.callSuper();
		this.variable = undefined;
	},
	
	getElement: function (doc, model) {
		var mdl = model;
		var vr = this.variable;
		var elmt = doc.createElement('input');
		elmt.type = "text";
		elmt.style.textAlign = 'right';
		this.decorate(elmt);
		elmt.value = sprintf("%.2f", vr.compute()); 
		this.resetters.push(function () { elmt.value = sprintf("%.2f", vr.compute());});
		if (vr.kind == 'input' || vr.kind == 'state' ) {
			elmt.onchange = function () {vr.setValue(elmt.value); mdl.computeAndUpdate();}; //updater needs to change if we allow autocompute disabled.
		}
//		if (vr.kind != 'input' ) {
			this.updaters.push(function () { elmt.value = sprintf("%.2f", vr.compute());});
//		}
		return elmt;
	}
});

Label = new JS.Class(InterfaceElement, {
	initialize: function () {
		this.callSuper();
		this.label = undefined;
	},
	
	getElement: function (doc, model) {
		var elmt = doc.createElement('div');
		elmt.innerHTML = this.label;
		this.decorate(elmt);
		return elmt;
	}	
});

NumericInput = new JS.Class(InterfaceElement, {
	initialize: function () {
		this.callSuper();
		this.variable = undefined;
		this.step = 0.1;
		this.min = undefined;
		this.max = undefined;
	},
	
	getElement: function (doc, model) {
		var vr = this.variable;
		var mdl = model;
		var buttonWidth = Math.round(this.height * 0.8);
		var elmt = doc.createElement('div');
		this.decorate(elmt);
		elmt.style.margin = "0px";
		elmt.style.padding = "0px";
		var ip = doc.createElement('input');
		ip.type='text';
		ip.style.position = 'absolute';
		ip.style.left = 0;
		ip.style.top = 0;
		ip.style.width = this.width - buttonWidth;
		ip.style.height = this.height;
		ip.style.margin = "0px";
		ip.style.padding = "0px";
		var up = doc.createElement('input');
		up.type='button';
		up.style.position = 'absolute';
		up.style.margin = "0px";
		up.style.padding = "0px";
		up.style.left = this.width - buttonWidth;
		up.style.top = -1;
		up.style.width = buttonWidth;
		up.style.height = 2 + this.height/2;
		var dn = doc.createElement('input');
		dn.type='button';
		dn.style.position = 'absolute';
		dn.style.margin = "0px";
		dn.style.padding = "0px";
		dn.style.left = this.width - buttonWidth;
		dn.style.top = this.height/2 -1;
		dn.style.width = buttonWidth;
		dn.style.height = 2 + this.height/2;

		ip.value = sprintf("%.2f", vr.compute());
			//handlers for the buttons. Need to add sensitivity for min and max
		var step = this.step; // in lambda functions this is undefined...
		var min = this.min;
		var max = this.max;
		if (this.max == undefined) {
			up.onclick = function () {vr.setValue(vr.value + step); mdl.computeAndUpdate();};
		} else {
			up.onclick = function () {
				var newval = vr.value + step;
				if (newval > max) { newval = max; } 
				vr.setValue(newval); 
				mdl.computeAndUpdate();
			};
		}
		if (this.min == undefined) {
			console.log("No minimum");
			dn.onclick = function () {vr.setValue(vr.value - step); mdl.computeAndUpdate();};
		} else {
			console.log("With minimum");
			dn.onclick = function () {
				console.log("Minimum: " + min);
				var newval = vr.value - step;
				if (newval < min) { newval = min; } 
				vr.setValue(newval); 
				mdl.computeAndUpdate();
			};
		}
		dn.onclick = function () {vr.setValue(vr.value - step); mdl.computeAndUpdate();};
		elmt.appendChild(ip);
		elmt.appendChild(up);
		elmt.appendChild(dn);
		if (vr.kind == 'input' || vr.kind == 'state' ) {
			ip.onchange = function () {vr.setValue(ip.value); mdl.computeAndUpdate();}; //updater needs to change if we allow autocompute disabled.
		}
		this.resetters.push(function () { ip.value = sprintf("%.2f", vr.compute());});

	//	if (vr.kind != 'input' ) {
			this.updaters.push(function () { ip.value = sprintf("%.2f", vr.compute());});
	//	}
		return elmt;
	}

});

Image = new JS.Class(InterfaceElement, {
	initialize: function () {
		this.callSuper();
		this.src = "";
	},

	getElement: function(doc, model) {
		var elmt = doc.createElement('image');
		this.decorate(elmt);
		elmt.src = this.src;
		return elmt;
	}
});

};

/**
sprintf() for JavaScript 0.6

Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of sprintf() for JavaScript nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL Alexandru Marasteanu BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


Changelog:
2007.04.03 - 0.1:
 - initial release
2007.09.11 - 0.2:
 - feature: added argument swapping
2007.09.17 - 0.3:
 - bug fix: no longer throws exception on empty paramenters (Hans Pufal)
2007.10.21 - 0.4:
 - unit test and patch (David Baird)
2010.05.09 - 0.5:
 - bug fix: 0 is now preceeded with a + sign
 - bug fix: the sign was not at the right position on padded results (Kamal Abdali)
 - switched from GPL to BSD license
2010.05.22 - 0.6:
 - reverted to 0.4 and fixed the bug regarding the sign of the number 0
 Note:
 Thanks to Raphael Pigulla <raph (at] n3rd [dot) org> (http://www.n3rd.org/)
 who warned me about a bug in 0.5, I discovered that the last update was
 a regress. I appologize for that.
**/

function str_repeat(i, m) {
	for (var o = []; m > 0; o[--m] = i);
	return o.join('');
}

function sprintf() {
	var i = 0, a, f = arguments[i++], o = [], m, p, c, x, s = '';
	while (f) {
		if (m = /^[^\x25]+/.exec(f)) {
			o.push(m[0]);
		}
		else if (m = /^\x25{2}/.exec(f)) {
			o.push('%');
		}
		else if (m = /^\x25(?:(\d+)\$)?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(f)) {
			if (((a = arguments[m[1] || i++]) == null) || (a == undefined)) {
				throw('Too few arguments.');
			}
			if (/[^s]/.test(m[7]) && (typeof(a) != 'number')) {
				throw('Expecting number but found ' + typeof(a));
			}
			switch (m[7]) {
				case 'b': a = a.toString(2); break;
				case 'c': a = String.fromCharCode(a); break;
				case 'd': a = parseInt(a); break;
				case 'e': a = m[6] ? a.toExponential(m[6]) : a.toExponential(); break;
				case 'f': a = m[6] ? parseFloat(a).toFixed(m[6]) : parseFloat(a); break;
				case 'o': a = a.toString(8); break;
				case 's': a = ((a = String(a)) && m[6] ? a.substring(0, m[6]) : a); break;
				case 'u': a = Math.abs(a); break;
				case 'x': a = a.toString(16); break;
				case 'X': a = a.toString(16).toUpperCase(); break;
			}
			a = (/[def]/.test(m[7]) && m[2] && a >= 0 ? '+'+ a : a);
			c = m[3] ? m[3] == '0' ? '0' : m[3].charAt(1) : ' ';
			x = m[5] - String(a).length - s.length;
			p = m[5] ? str_repeat(c, x) : '';
			o.push(s + (m[4] ? a + p : p + a));
		}
		else {
			throw('Huh ?!');
		}
		f = f.substring(m[0].length);
	}
	return o.join('');
}
