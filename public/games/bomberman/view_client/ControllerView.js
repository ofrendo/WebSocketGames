"use strict";

var CONST = GameState.CONST;

// PIXIjs view of a controller with buttons, for use with smartphones
class ControllerView {
	constructor(rendererArgs, playerInputState) {
	
		//var spritePath = "/games/bomberman/res/Bombing_Chap_Sprite_Set/gen/bombermanAll.json";
		//this.loader = PIXI.loader.add("bomberman" + rendererArgs.viewI, spritePath);
	
		this.stage = new PIXI.Container();
		this.stage.interactive = true;
		this.rendererArgs = rendererArgs;
		this.renderer = this.generateRenderer(rendererArgs);
		this.playerInputState = playerInputState;

		// Do textures
		var arrowTextures = this.getArrowTextures();
		for (var i=0;i<arrowTextures.length;i++) {
			var t = arrowTextures[i];
			t.interactive = true;
			t.on("mousedown", this.onArrowDown.bind(this));
			t.on("touchstart", this.onArrowDown.bind(this));
			t.on("mouseup", this.onArrowUp.bind(this));
			t.on("touchend", this.onArrowUp.bind(this));
			this.stage.addChild(t);
		}

		this.animate();
	}

	animate() {
		if (typeof this.onAnimationFrame === "function") {
			this.onAnimationFrame();
		}

		this.renderer.render(this.stage);
		
		requestAnimationFrame(this.animate.bind(this));
	}	

	setOnAnimationFrame(callback) {
		this.onAnimationFrame = callback;
	}

	getArrowTextures() {
		var result = [];
		//var upArrow = this.getImageTexture(CONST.CONTROLLER.ARROW_PATH);
		var arrowWidth = 100;
		var arrowLength = (this.rendererArgs.h-arrowWidth) / 2 ;

		var upArrow = PIXI.Sprite.fromImage(CONST.CONTROLLER.ARROW_PATH);
		upArrow.position.x = arrowLength;
		upArrow.width = arrowWidth;
		upArrow.height = arrowLength;
		upArrow.scale.y *= -1;
		upArrow.anchor.set(0, 1);
		upArrow.direction = CONST.DIRECTION.UP;

		var leftArrow = PIXI.Sprite.fromImage(CONST.CONTROLLER.ARROW_PATH);
		leftArrow.position.x = arrowLength/2;
		leftArrow.position.y = arrowLength + arrowWidth/2;
		leftArrow.width = arrowWidth;
		leftArrow.height = arrowLength;
		leftArrow.anchor.set(0.5, 0.5);
		leftArrow.rotation = 90*Math.PI / 180;
		leftArrow.direction = CONST.DIRECTION.LEFT;

		var rightArrow = PIXI.Sprite.fromImage(CONST.CONTROLLER.ARROW_PATH);
		rightArrow.position.x = arrowLength*1.5 + arrowWidth;
		rightArrow.position.y = arrowLength + arrowWidth/2;
		rightArrow.width = arrowWidth;
		rightArrow.height = arrowLength;
		rightArrow.anchor.set(0.5, 0.5);
		rightArrow.rotation = 270 * Math.PI / 180;
		rightArrow.direction = CONST.DIRECTION.RIGHT

		var downArrow = PIXI.Sprite.fromImage(CONST.CONTROLLER.ARROW_PATH);
		downArrow.position.x = arrowLength + arrowWidth/2;
		downArrow.position.y = arrowLength*1.5 + arrowWidth;
		downArrow.width = arrowWidth;
		downArrow.height = arrowLength;
		downArrow.anchor.set(0.5, 0.5);
		downArrow.rotation = 0 * Math.PI / 180;
		downArrow.direction = CONST.DIRECTION.DOWN;

		result.push(upArrow);
		result.push(leftArrow);
		result.push(rightArrow);
		result.push(downArrow);
		return result;
	}
	onArrowDown(e) {
		//console.log(e.target.direction);
		var d = e.target.direction;
		switch (d) {
			case CONST.DIRECTION.UP: 
				this.playerInputState.setKeyUp(true);
				break;
			case CONST.DIRECTION.LEFT: //a
				this.playerInputState.setKeyLeft(true);
				break;
			case CONST.DIRECTION.DOWN: //s
				this.playerInputState.setKeyDown(true);
				break;
			case CONST.DIRECTION.RIGHT: //d
				this.playerInputState.setKeyRight(true);
				break;
		}
		
		if (navigator.vibrate) {
			navigator.vibrate(100);
		}
	}
	onArrowUp(e) {
		var d = e.target.direction;
		switch (d) {
			case CONST.DIRECTION.UP: 
				this.playerInputState.setKeyUp(false);
				break;
			case CONST.DIRECTION.LEFT: //a
				this.playerInputState.setKeyLeft(false);
				break;
			case CONST.DIRECTION.DOWN: //s
				this.playerInputState.setKeyDown(false);
				break;
			case CONST.DIRECTION.RIGHT: //d
				this.playerInputState.setKeyRight(false);
				break;
		}
	}	

	getImageTexture(path) {
		var img = new Image();
		img.src = path;
		var base = new PIXI.BaseTexture(img);
		var texture = new PIXI.Texture(base);// return you the texture
		console.log(texture.position);
		return texture;
	}

	generateRenderer(rendererArgs) {
		var renderer = new PIXI.WebGLRenderer(rendererArgs.w, rendererArgs.h);
		console.log("Initializing renderer:");
		console.log(rendererArgs)
		var elem = renderer.view;
		elem.style.marginTop = rendererArgs.mTop + "px";
		elem.style.marginLeft = rendererArgs.mLeft + "px";
		document.body.appendChild(elem);
		//console.log(elem);
		self.w = rendererArgs.w;
		self.h = rendererArgs.h;
		return renderer;
	}

}