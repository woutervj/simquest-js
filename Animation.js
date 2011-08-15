var Animation, Shape, Ellipse, Rectangle, Line;

function initAnimation() {

Animation = new JS.Class(InterfaceElement, {
	initialize : function () {
		this.callSuper();
		this.model = undefined;
		this.shapes = new Array();
		this.showGrid = false;
		this.showAxesOnTop = false;
		console.log("änimation created")
	},
	
	addShape : function(aShape) {
		aShape.setAnimation(this);
		this.shapes.push(aShape);
	},
	
	setXaxis: function(props) {
		this.xMin = props['minimum'];
		this.xMax = props['maximum'];
		this.xMajor = props['major'];
		this.xMinor = props['minor'];
	},
	
	setYaxis: function (props) {
		this.yMin = props['minimum'];
		this.yMax = props['maximum'];
		this.yMajor = props['major'];
		this.yMinor = props['minor'];
	},
	
	transformX: function (worldX) {
		if (this.xMin == undefined) {
			console.log("x-axis undefined");
			return worldX;
		} else {
			return Math.round(this.left+ (worldX-this.xMin)*(this.right-this.left)/(this.xMax - this.xMin)); 
		}
	},
	
	transformY: function (worldY) {
		if (this.yMin == undefined) {
			console.log("y-axis undefined");
			return worldY;
		} else {
			return this.top+ (worldY-this.yMin)*(this.bottom-this.top)/(this.yMax - this.yMin); 
		}
	},

	transformW: function (worldW) {
		if (this.xMin == undefined) {
			return worldW;
		} else {
			return worldW*(this.right-this.left)/(this.xMax - this.xMin); 
		}
	},	
	
	transformH: function (worldH) {
		if (this.yMin == undefined) {
			return worldH;
		} else {
			return worldH*(this.bottom-this.top)/(this.yMax - this.yMin); 
		}
	},

	getElement: function(doc, model)
	{
		//build the SVG structure.
		var elmt = doc.createElementNS("http://www.w3.org/2000/svg", 'svg');
		var mdl = model;
		elmt.version="1.1"
		this.decoratePosition(elmt);
		console.log("this.shapes.length = " + this.shapes.length);
		for (var i=0; i<this.shapes.length; i++) {
			elmt.appendChild(this.shapes[i].getSVGElement(doc, mdl));
		}
		console.log("animation created");
		return elmt;
	}
});

Shape = new JS.Class({
		
	setAnimation: function(anAnimation) {
		this.animation = anAnimation;
	},
	
	setPlacement: function (plcmt) 
	{
		//subclasses may override
		this.x = plcmt['position']['x'];
		this.y = plcmt['position']['y'];
		this.width = plcmt['size']['width'];
		this.height = plcmt['size']['height'];
		this.anchor= plcmt['anchor'];
	},
	
	setColors: function (clrs)
	{
		this.fgRed = clrs['foreground']['red'];
		this.fgGreen = clrs['foreground']['green'];
		this.fgBlue = clrs['foreground']['blue'];
		this.bgRed = clrs['background']['red'];
		this.bgGreen = clrs['background']['green'];
		this.bgBlue = clrs['background']['blue'];
	},
	
	getSVGElement: function(doc, model)
	{
		//subclasses do your work
		console.log("This element does not implement getSVGElement");
		return null;
	},
	
	computePlacement: function(elmt)
	{
		//compute the placement of the shape in screen coordinates and pass them to the element
		//subclasses work as the element attributes vary
	},
	
	rgbString: function(red, green, blue)
	{
		var rgbStr = "rgb("+Math.round(255*red)+","+Math.round(255*green)+","+Math.round(255*blue)+")";
		console.log(rgbStr);
		return rgbStr;
	},
	
	computeColor: function(elmt)
	{
		//colorize the objects
		elmt.style.fill = this.rgbString(this.bgRed.compute(), this.bgGreen.compute(), this.bgBlue.compute());
		elmt.style.stroke = this.rgbString(this.fgRed.compute(), this.fgGreen.compute(), this.fgBlue.compute());
	}
});

Ellipse = new JS.Class(Shape, {

	getSVGElement: function (doc, model)
	{
		var elmt = doc.createElementNS("http://www.w3.org/2000/svg",'ellipse');
		this.computePlacement(elmt);
		this.computeColor(elmt);
		var mySelf = this;
		this.animation.updaters.push (function(){mySelf.computePlacement(elmt); mySelf.computeColor(elmt);});
		this.animation.resetters.push (function(){mySelf.computePlacement(elmt); mySelf.computeColor(elmt);});
		console.log('ellipse added');
		return elmt;
	},
	

	computePlacement: function (elmt)
	{
		//compute the position using the model and convert to screen coordinates

		var x = this.animation.transformX(this.x.compute());
		var y = this.animation.transformY(this.y.compute());
		var width = this.animation.transformW(this.width.compute());
		var height = this.animation.transformH(this.height.compute());
		switch (this.anchor) 
		{
			case 'Center':
				elmt.cx.baseVal.value = x;
				elmt.cy.baseVal.value = y;
				elmt.rx.baseVal.value = width/2;
				elmt.ry.baseVal.value = height/2;
				break;
				
			case 'TopLeft':
				elmt.cx.baseVal.value = x + width/2 
				elmt.cy.baseVal.value = y + height/2;
				elmt.rx.baseVal.value = width/2;
				elmt.ry.baseVal.value = height/2;
				break;
				
			case 'TopRight':
				elmt.cx.baseVal.value = x + width/2 
				elmt.cy.baseVal.value = y - height/2;
				elmt.rx.baseVal.value = width/2;
				elmt.ry.baseVal.value = height/2;
				break;
			
			case 'BottomLeft':
				elmt.cx.baseVal.value = x - width/2 
				elmt.cy.baseVal.value = y + height/2;
				elmt.rx.baseVal.value = width/2;
				elmt.ry.baseVal.value = height/2;
				break;
			
			case 'BottomRight':
				elmt.cx.baseVal.value = x - width/2 
				elmt.cy.baseVal.value = y - height/2;
				elmt.rx.baseVal.value = width/2;
				elmt.ry.baseVal.value = height/2;
				break;
			
			default:
				elmt.cx.baseVal.value = x;
				elmt.cy.baseVal.value = y;
				elmt.rx.baseVal.value = width/2;
				elmt.ry.baseVal.value = height/2;
				break;
		}	
	}
});

Rectangle = new JS.Class(Shape, {
});

Line = new JS.Class(Shape, {
});

};