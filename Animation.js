var Animation, Shape, Ellipse, Rectangle, Line;

function initAnimations() {

Animation = JS.Class({
	initialize (canvasName, model) {
		this.setCanvas(canvasName);
		this.model = model;
		this.shapes = new Array();
	},
	
	addShape : function(aShape) {
		aShape.setAnimation(this);
		this.shapes.push(aShape);
	},
	
	setWorld: function (left, right, top, bottom) {
		this.left = left;
		this.right = right;
		this.top = top;
		this.bottom = bottom;
	},
	
	setCanvas: function (canvasName) {
		this.canvas = document.getElementById(canvasName);
		if (!this.canvas) { console.log("Could not find canvas"); return 0;}
	},
	
	draw: function () {
		if (!this.canvas) {
			console.log("No valid canvas set");
			return 0;
		}
		
		var context = canvas.getContext();
		context.clearRect(0,0, this.canvas.width, this.canvas.height);
		for (var i = 0; i< this.shapes.length; i++) {
			this.shapes[i].draw(context);
		}
	},
	
	transformX: function (worldX) {
		if (this.left == undefined) {
			return worldX;
		} else {
			return this.canvas.width*(worldX-left)/(right - left) 
		}
	},
	
	transformY: function (worldY) {
		if (this.top == undefined) {
			return worldY;
		} else {
			return this.canvas.height*(1+(worldX-bottom)/(bottom - top)); 
		}
	}	
});

Shape = JS.Class({
	initialize: function () {
		this.strokeColor = black;
		this.fillColor = black;
		this.animation = new Animation();
	},
	
	setAnimation: function(anAnimation) {
		this.animation = anAnimation;
	}
});

Ellipse = JS.Class(Shape, {

});

Rectangle = JS.Class(Shape, {
	initialize: function (left, right, top, bottom) {
		this.callSuper();
		this.left = left;
		this.right = right;
		this.top = top;
		this.bottom = bottom;
	},
	
	draw: function(context) {
		context.fillStyle = this.fillColor;
		context.strokeStyle = this.strokeColor;
		var x = this.animation.transformX(left);
		var y = this.animation.transformY(top);
		var w = this.animation.transformX(right) - x;
		var h = this.animation.transformY(bottom) - y;
		context.drawRect(x,y,w,h)
	}
});

Line = JS.Class(Shape, {

});

};