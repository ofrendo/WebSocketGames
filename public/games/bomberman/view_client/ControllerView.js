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
		/*this.arrowTextures = this.getArrowTextures();
		for (var i=0;i<this.arrowTextures.length;i++) {
			var t = this.arrowTextures[i];
			t.interactive = true;
			t.on("mousedown", this.onArrowDown.bind(this));
			t.on("touchstart", this.onArrowDown.bind(this));
			t.on("mouseup", this.onArrowUp.bind(this));
			t.on("touchend", this.onArrowUp.bind(this));
			this.stage.addChild(t);
		}*/
		this.controllerTexture = this.getControllerTexture();
		this.stage.addChild(this.controllerTexture);

		// cross lines
		this.crossLines = this.getCrossLinesTexture();
		this.stage.addChild(this.crossLines);

		this.bombTexture = this.getBombTexture();
		this.stage.addChild(this.bombTexture);

		this.adaptTextures();
		this.animate();
	}

	animate() {
		if (typeof this.onAnimationFrame === "function") {
			this.onAnimationFrame();
			fpsMeter.tick();
		}

		this.renderer.render(this.stage);
		
		requestAnimationFrame(this.animate.bind(this));
	}	

	setOnAnimationFrame(callback) {
		this.onAnimationFrame = callback;
	}

	getControllerTexture(rendererArgs) {
		var t = new PIXI.Graphics();
		t.interactive = true;

		t.on("mousedown", this.onControllerDown.bind(this));
		t.on("touchstart", this.onControllerDown.bind(this));

		t.on("mousemove", this.onControllerDrag.bind(this));
		t.on("touchmove",  this.onControllerDrag.bind(this));

		t.on("mouseup", this.onControllerUp.bind(this));
		t.on("touchend", this.onControllerUp.bind(this));
		return t;
	}
	getCrossLinesTexture() {
		var t = new PIXI.Graphics();
		return t;
	}
	getBombTexture() {
		var t = new PIXI.Sprite.fromImage(CONST.CONTROLLER.BOMB_PATH);
		t.anchor.set(0,0);
		t.interactive = true;
		t.on("mousedown", this.onBombDown.bind(this));
		t.on("touchstart", this.onBombDown.bind(this));
		t.on("mouseup", this.onBombUp.bind(this));
		t.on("touchend", this.onBombUp.bind(this));
		return t;
	}
	adaptTextures() {
		this.controllerTexture.clear();
		this.controllerTexture.beginFill(0xFFFFFF);
		this.controllerTexture.drawCircle(this.rendererArgs.h/2, this.rendererArgs.h/2, this.rendererArgs.h/2);
		this.controllerTexture.endFill();

		this.crossLines.clear();
		this.crossLines.beginFill(0x000000);
		this.crossLines.lineStyle(10, 0x000000);
		this.crossLines.moveTo(0, 0);
		this.crossLines.lineTo(this.rendererArgs.h, this.rendererArgs.h);
		this.crossLines.moveTo(0, this.rendererArgs.h);
		this.crossLines.lineTo(this.rendererArgs.h, 0);	

		var p = this.rendererArgs.h/4;
		var l = this.rendererArgs.h - 2*p;
		this.bombTexture.position.set(this.rendererArgs.h + p, p);
		this.bombTexture.height = l;
		this.bombTexture.width = l;
	}

	onControllerDown(e) {
		this.dragging = true;
		this.setPlayerInputStateKeys();
		this.vibrate(50);
	}
	onControllerDrag(e) {
		if (this.dragging === true) {
			this.setPlayerInputStateKeys();			
		}
	}
	onControllerUp(e) {
		this.dragging = false;
		this.playerInputState.setMovementKeysFalse();
		//this.vibrate(50);
	}
	onBombDown(e) {
		this.vibrate(50);
		this.playerInputState.setKeyBomb(true);
	}
	onBombUp(e) {
		//console.log("Here");
		//this.vibrate(50);
		this.playerInputState.setKeyBomb(false);
	}
	getMousePos() {
		return this.renderer.plugins.interaction.eventData.data.global;
		//return this.renderer.plugins.interaction.mouse.global;
	}
	setPlayerInputStateKeys(val) {
		var mousePos = this.getMousePos();
		var direction = this.getDirectionFromMousePos(mousePos);
		this.playerInputState.setMovementKeysFalse();
		switch (direction) {
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
	}

	getDirectionFromMousePos(pos) {
		var h = this.rendererArgs.h;
		var x = pos.x;
		var y = pos.y;
		if (x > h || y > h) {
			return null;
		}

		if (x+y < h && x > y) { // top
			//console.log("HERE")
			return CONST.DIRECTION.UP;
		}
		else if (x+y > h && x > y) {
			return CONST.DIRECTION.RIGHT;
		}
		else if (x+y < h && x < y) {
			return CONST.DIRECTION.LEFT;
		}
		else {
			return CONST.DIRECTION.DOWN;
		}
	}
	vibrate(duration) {
		if (navigator.vibrate) {
			navigator.vibrate(duration);
		}
	}
	/*
	getArrowTextures() {
		var result = [];

		var upArrow = PIXI.Sprite.fromImage(CONST.CONTROLLER.ARROW_PATH);
		var leftArrow = PIXI.Sprite.fromImage(CONST.CONTROLLER.ARROW_PATH);
		var rightArrow = PIXI.Sprite.fromImage(CONST.CONTROLLER.ARROW_PATH);
		var downArrow = PIXI.Sprite.fromImage(CONST.CONTROLLER.ARROW_PATH);

		result.push(upArrow);
		result.push(leftArrow);
		result.push(rightArrow);
		result.push(downArrow);
		return result;
	}
	adaptTextures() {
		var arrowWidth = 100;
		var arrowLength = (this.rendererArgs.h-arrowWidth) / 2;

		var upArrow = this.arrowTextures[0];
		upArrow.position.x = arrowLength;
		upArrow.width = arrowWidth;
		upArrow.height = arrowLength;
		upArrow.scale.y *= -1;
		upArrow.anchor.set(0, 1);
		upArrow.direction = CONST.DIRECTION.UP;

		var leftArrow = this.arrowTextures[1];
		leftArrow.position.x = arrowLength/2;
		leftArrow.position.y = arrowLength + arrowWidth/2;
		leftArrow.width = arrowWidth;
		leftArrow.height = arrowLength;
		leftArrow.anchor.set(0.5, 0.5);
		leftArrow.rotation = 90*Math.PI / 180;
		leftArrow.direction = CONST.DIRECTION.LEFT;

		var rightArrow = this.arrowTextures[2];
		rightArrow.position.x = arrowLength*1.5 + arrowWidth;
		rightArrow.position.y = arrowLength + arrowWidth/2;
		rightArrow.width = arrowWidth;
		rightArrow.height = arrowLength;
		rightArrow.anchor.set(0.5, 0.5);
		rightArrow.rotation = 270 * Math.PI / 180;
		rightArrow.direction = CONST.DIRECTION.RIGHT

		var downArrow = this.arrowTextures[3];
		downArrow.position.x = arrowLength + arrowWidth/2;
		downArrow.position.y = arrowLength*1.5 + arrowWidth;
		downArrow.width = arrowWidth;
		downArrow.height = arrowLength;
		downArrow.anchor.set(0.5, 0.5);
		downArrow.rotation = 0 * Math.PI / 180;
		downArrow.direction = CONST.DIRECTION.DOWN;
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
	}	*/



	/*getImageTexture(path) {
		var img = new Image();
		img.src = path;
		var base = new PIXI.BaseTexture(img);
		var texture = new PIXI.Texture(base);// return you the texture
		console.log(texture.position);
		return texture;
	}*/

	generateRenderer(rendererArgs) {
		var renderer = new PIXI.WebGLRenderer(rendererArgs.w, rendererArgs.h);
		console.log("Initializing renderer:");
		console.log(rendererArgs)
		var elem = renderer.view;
		elem.style.marginTop = rendererArgs.mTop + "px";
		elem.style.marginLeft = rendererArgs.mLeft + "px";
		document.body.appendChild(elem);
		//console.log(elem);
		return renderer;
	}

	adaptRenderer(rendererArgs) {
		this.rendererArgs = rendererArgs;
		this.renderer.resize(rendererArgs.w, rendererArgs.h);
		this.adaptTextures();
	}

}