// Todo: too much of the drawing/submission logic is here, should eventually move out into Vue
import p5 from 'p5';
import isElectron from 'is-electron';
import { v4 as uuidv4 } from 'uuid';

var assetsURI;
if (typeof (process) != 'undefined' && isElectron() == true && (process.env.NODE_ENV != 'development')) {
  assetsURI = 'http://localhost:3000';
} else {
  assetsURI = '.';
}

const canvasW = 1080;
const canvasH = 1920;

const maxDrawingsToShow = 5;

const buttonDeadZoneHeight = 200;

/*--------------------- Pareidolia - P5 Start -------------------------*/
// Background images 
  class imageStruct {
    constructor(imgName, path) {
      this.name = imgName;
      this.path = path;
      this.loadedImage;
    }
  }

  const imgPathBase = "assets/backgroundImages/";

  const imgPathList = [
    "img_Holes-in-stone.png",
    "img_Building-face.png",
    "img_Tree-bark.png",
    "sandstone.jpg",
    "boulders.jpg",
    "img_Wood-grain.png",
    "singleboulder.jpg",
    "gabriel-vasiliu-Yg74qlouVT0-unsplash.jpg"
  ]

/*--------------------- Drawings variables -------------------------*/
/* 
 * class Drawing 
 * {String} drawing.colorStr
 * {Array.Array{x:number, y:number}} drawing.strokes
*/
class Drawing {
  constructor(imgName, imgIndex, colorStr, strokes) {
    this.id = uuidv4();
    this.imgName = imgName;
    this.imgIndex = imgIndex;
    this.colorStr = colorStr;
    this.strokes = strokes;
  }
}
const drawingStorePath = "assets/drawings.json";

const setStrokeWeight = 10;
const colorList = ["aqua", "red", "lime", "violet", "yellow"];

/*--------------------- END -------------------------*/

class Sketch {
  constructor(
    vueContainer,
    config,
    appScale,
    drawingData) {

    this.vueContainer = vueContainer;
    this.config = config;
    this.appScale = appScale;
    this.font;

    this.vueContainer.mode = this.vueContainer.Modes.DRAW;

    this.loadedImages = [];
    this.currentImageIndex = 0;

    this.drawingList = drawingData; // This contains all drawings stored in memory
    this.strokeList = [];
    this.currentStroke = [];
    this.currentColorIndex = 0;

    // Variables for rendering the drawings during show or admin mode 
    this.drawingsForCurrentImage = [];
    this.currentImageDrawingIndex = 0;
    this.drawingOpacity = 0;
    this.drawingColor;
    this.flashOpacity = 0;

    const s = p => {
      p.preload = () => {
        for (var path of imgPathList) {
          let i = new imageStruct(path, imgPathBase + path);
          i.loadedImage = p.loadImage(i.path);
          this.loadedImages.push(i);
        }
      };

      p.setup = () => {
        p.createCanvas(canvasW, canvasH);

        p.strokeWeight(setStrokeWeight);
        p.stroke(colorList[this.currentColorIndex]);
        p.background('blue');

        p.drawingContext.shadowBlur = 20;
        p.drawingContext.shadowColor = 'black';

        this.renderBackground();
      };

      // Draw loop 
      // The only calls we make here are animations that need to be drawn every frame
      p.draw = () => {
        if ((this.vueContainer.mode == this.vueContainer.Modes.SHOW)) {
          this.renderShowModeFrame();
        }
        this.handleFlashAnimation();
      };

      p.reset = () => {
        p.clear();
        this.vueContainer.mode == this.vueContainer.Modes.DRAW;
        this.nextImage();
        this.resetCanvas();
      };

      p.mouseReleased = () => {
        if (this.vueContainer.mode == this.vueContainer.Modes.DRAW) {
          this.endStroke();
        }
      }

      p.touchEnded = () => {
        if (this.vueContainer.mode == this.vueContainer.Modes.DRAW) {
          this.endStroke();
        }
      }

      p.touchStarted = () => {
        // touch functionality means the mouse can "jump" across the screen 
        // pmouse is previous mouse; this is built-in P5 functionality 

        // this hack ensures that lines don't cross per-touch
        // p.pmouseX = p.mouseX / this.appScale;
        // p.pmouseY = p.mouseY / this.appScale;

        this.currentStroke.push({ x: p.mouseX / this.appScale, y: p.mouseY / this.appScale });

        // TODO: handle this in the vue component 
        if (this.vueContainer.mode == this.vueContainer.Modes.SHOW) {
          this.enterDrawMode();
        }
      }

      p.mouseDragged = () => {
        if (this.vueContainer.mode == this.vueContainer.Modes.DRAW && this.pointerLocationIsValid()) {
          this.currentStroke.push({ x: p.mouseX / this.appScale, y: p.mouseY / this.appScale });
          p.line(
            this.currentStroke.at(-2).x,
            this.currentStroke.at(-2).y,
            this.currentStroke.at(-1).x,
            this.currentStroke.at(-1).y
          )
        }
      }
    };

    this.p5SketchObject = new p5(s, 'sketch');
  }

  //-------------------- Mode & Mode Control ---------------------//
  // This starts our "submit" animations and transitions us to "show" after 2 seconds 
  // During show mode, we render the last X drawings for this image 
  // and automatically return to Draw mode after a set time
  enterSubmitMode = () => {
    this.renderBackground();
  }

  enterShowMode = () => {
    this.showDrawingsSetup();
  }

  // Admin Mode is reachable via keypress 'm' during Draw mode. 
  // Admin mode requires a keyboard, and enables drawing management 
  // <- and -> for navigation 
  // 'd' for delete
  enterAdminMode = () => {
    this.vueContainer.mode = this.vueContainer.Modes.ADMIN;
    this.showDrawingsSetup(); 
    this.adminRenderDrawing();
  }

  // Draw mode is where we spend most of our time 
  // Here the user can draw on a given image and submit their drawing
  enterDrawMode = () => {
    this.vueContainer.mode = this.vueContainer.Modes.DRAW;
    this.nextImage(); // Move to next image after show

    this.showModeTeardown();
  }

  showDrawingsSetup = () => {
    // Get a max of maxDrawingsToShow previous drawings to show during show mode 
    this.drawingsForCurrentImage = this.drawingList.filter(d => d.imgName == this.loadedImages[this.currentImageIndex].name);
    this.currentImageDrawingIndex = 0;

    if (this.vueContainer.mode == this.vueContainer.Modes.ADMIN) {
      this.drawingOpacity = 255;
    } else {
      this.drawingOpacity = 0;
      if (this.drawingsForCurrentImage.length > maxDrawingsToShow) {
        this.drawingsForCurrentImage = this.drawingsForCurrentImage.slice(-(maxDrawingsToShow)); // only show the 5 latest images
      }
    }
    this.drawingColor = this.p5SketchObject.color(this.drawingsForCurrentImage[this.currentImageDrawingIndex].colorStr);
  }

  showModeTeardown = () => {
    this.currentImageDrawingIndex = 0;
    this.drawingOpacity = 0;
    this.drawingsForCurrentImage = [];
  }

  adminRenderDrawing = () => {
    const p = this.p5SketchObject;

    // Reset background 
    this.renderBackground();

    // Render the drawing 
    p.push();
    let drawing = this.drawingsForCurrentImage[this.currentImageDrawingIndex];
    this.drawingColor = this.p5SketchObject.color(this.drawingsForCurrentImage[this.currentImageDrawingIndex].colorStr);
    p.stroke(this.drawingColor);
    this.drawStrokes(drawing.strokes);
    p.pop();
  }

  renderShowModeFrame = () => {
    const p = this.p5SketchObject;

    // Reset background 
    this.renderBackground();

    // Render the drawing at current opacity 
    p.push();
    let drawing = this.drawingsForCurrentImage[this.currentImageDrawingIndex];
    this.drawingColor.setAlpha(this.drawingOpacity);
    p.stroke(this.drawingColor);
    this.drawStrokes(drawing.strokes);
    p.pop();

    if (this.drawingOpacity < 255) {
      this.drawingOpacity += 2;
    } else {
      this.nextDrawing(p);
      this.drawingOpacity = 0;
    }
  }

  nextDrawing = () => {
    this.currentImageDrawingIndex = this.currentImageDrawingIndex < this.drawingsForCurrentImage.length - 1 ? this.currentImageDrawingIndex + 1 : 0;
    this.drawingColor = this.p5SketchObject.color(this.drawingsForCurrentImage[this.currentImageDrawingIndex].colorStr);
    if (this.vueContainer.mode == this.vueContainer.Modes.ADMIN) {
      this.adminRenderDrawing();
    }
  }

  prevDrawing = () => {
    this.currentImageDrawingIndex = this.currentImageDrawingIndex > 0 ? this.currentImageDrawingIndex - 1 : this.drawingsForCurrentImage.length - 1;
    this.drawingColor = this.p5SketchObject.color(this.drawingsForCurrentImage[this.currentImageDrawingIndex].colorStr);
    this.adminRenderDrawing();
  }

  deleteDrawing = () => {
    let targetId = this.drawingsForCurrentImage[this.currentImageDrawingIndex].id;
    let targetIndex = this.drawingList.findIndex((d) => d.id == targetId);

    if (targetIndex < 0) {
      console.log('Target not found during delete');
      return;
    } else {
      this.drawingList.splice(targetIndex, 1);
      this.drawingsForCurrentImage.splice(this.currentImageDrawingIndex, 1); // need to update our local copy of filtered images

      if (this.currentImageDrawingIndex >= this.drawingsForCurrentImage.length) { // If we deleted the last drawing
        this.currentImageDrawingIndex = 0;
      }
      this.adminRenderDrawing();

      this.vueContainer.updateDrawingData(this.drawingList);
    }
  }

  handleFlashAnimation = () => {
    const p = this.p5SketchObject;

    if (this.flashOpacity > 0) {
      p.push();
      this.renderBackground();

      // Render the "flash" animation
      p.noStroke();
      let flashColor = p.color("white");
      flashColor.setAlpha(this.flashOpacity);
      p.fill(flashColor);
      p.rect(0, 0, canvasW, canvasH);
      this.flashOpacity = this.flashOpacity - 10;
      p.pop(0);
    }
  }

  //-------------------- Mode & Mode Control ---------------------//
  nextImage = () => {
    this.currentImageIndex = this.currentImageIndex >= this.loadedImages.length - 1 ? 0 : this.currentImageIndex + 1;
    this.resetCanvas(); // also remove the current drawings 
  }

  prevImage = () => {
    console.log(this.currentImageIndex);
    this.currentImageIndex = this.currentImageIndex > 0 ? this.currentImageIndex - 1 : this.loadedImages.length - 1;
    console.log(this.currentImageIndex);
    this.resetCanvas(); // also remove the current drawings 
  }

  renderBackground = () => {
    this.p5SketchObject.image(this.loadedImages[this.currentImageIndex].loadedImage, 0, 0, canvasW, canvasH);
  }

  resetCanvas = () => {
    this.strokeList = [];
    this.renderBackground();
  }

  //-------------------- Strokes and Drawing ---------------------//
  submitDrawing = () => {
    const p = this.p5SketchObject;

    if (this.strokeList.length > 0) {
      let d = new Drawing(this.loadedImages[this.currentImageIndex].name, this.currentImageIndex, colorList[this.currentColorIndex], this.strokeList);
      this.drawingList.push(d);

      this.flashOpacity = 255;
      this.strokeList = [];
      this.renderBackground();
      this.changeColor();
    }

    this.vueContainer.updateDrawingData(this.drawingList);
  }

  changeColor = () => {
    this.currentColorIndex = this.currentColorIndex >= colorList.length - 1 ? 0 : this.currentColorIndex + 1;
    this.p5SketchObject.stroke(colorList[this.currentColorIndex]);
  }

  endStroke = () => {
    // commit this stroke to the StrokeList
    if (this.currentStroke.length > 1) {
      this.strokeList.push(this.currentStroke);
    }

    //clear stroke for next touch
    this.currentStroke = [];
  }

  drawStrokes = (slist) => {
    const p = this.p5SketchObject;
    for (var stroke of slist) {
      if (stroke.length > 1) {
        for (var i = 1; i < stroke.length; i++) {
          var lastPoint = stroke[i - 1];
          var currentPoint = stroke[i];
          p.line(lastPoint.x, lastPoint.y, currentPoint.x, currentPoint.y);
        }
      }
    }
  }

  pointerLocationIsValid = () => {
    const p = this.p5SketchObject;
    let lastPoint = this.currentStroke.at(-1);
    let d = p.dist(lastPoint.x, lastPoint.y, p.mouseX / this.appScale, p.mouseY / this.appScale);

    if (d < 5 || d > 100 || p.mouseY / this.appScale > (1920 - buttonDeadZoneHeight)) {
      return false;
    } else {
      return true;
    }
  }

  undo = () => {
    if (this.strokeList.length > 0) {
      this.strokeList.pop();
      this.renderBackground();
      this.drawStrokes(this.strokeList);
    }
  }

  //-------------------- Object Control ---------------------//
  reset() {
    this.p5SketchObject.reset();
  }

  remove() {
    this.p5SketchObject.remove();
  }
}

export { Sketch };