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
const showModeLength = 10000; //default should be 30,000, shortened for testing

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
  "tree.jpg",
  "sandstone.jpg",
  "mountain.jpg",
  "burl.jpg",
  "boulders.jpg",
  "house.jpg",
  "singleboulder.jpg"
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

/* There are three modes; draw mode, submit mode, and show mode 
 * Drawing + drawing IO, image navigation, only available in drawing mode 
 */
const Modes = Object.freeze({
  DRAW: 0,
  SUBMIT: 1,
  SHOW: 2
});

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

    this.adminMode = false;
    this.currentMode = Modes.DRAW;
    this.timeEnteredShow = 0;

    this.loadedImages = [];
    this.currentImageIndex = 0;
    this.currentColorIndex = 0;

    this.drawingList = drawingData;
    this.strokeList = [];
    this.currentStroke = [];

    this.drawingsForCurrentImage = [];
    this.currentImageDrawingIndex = 0;
    this.drawingOpacity = 0;
    this.drawingColor;
    this.flashOpacity = 0;

    const s = p => {
      p.preload = () => {
        this.font = p.loadFont('assets/fonts/Explo-Bold.otf');
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
      // TODO: handle flash animation better, more cleanly 
      p.draw = () => {
        if (this.currentMode == Modes.SHOW) {
          this.renderShowModeFrame();
        }
        this.handleFlashAnimation();
      };

      p.reset = () => {
        p.clear();
        this.nextImage();
        this.resetCanvas();
      };

      p.mouseReleased = () => {
        if (this.currentMode == Modes.DRAW) {
          this.endStroke();
        }
      }

      p.touchEnded = () => {
        if (this.currentMode == Modes.DRAW) {
          this.endStroke();
        }
      }

      p.touchStarted = () => {
        // touch functionality means the mouse can "jump" across the screen 
        // pmouse is previous mouse; this is built-in P5 functionality 

        // this hack ensures that lines don't cross per-touch
        p.pmouseX = p.mouseX/this.appScale;
        p.pmouseY = p.mouseY/this.appScale;

        this.currentStroke.push({ x: p.mouseX/this.appScale, y: p.mouseY/this.appScale });

        // TODO: handle this in the vue component 
        if (this.currentMode == Modes.SHOW) {
          this.toggleMode();
        }
      }

      p.mouseDragged = () => {
        if (this.currentMode == Modes.DRAW && this.pointerLocationIsValid()) {
          this.currentStroke.push({ x: p.mouseX/this.appScale, y: p.mouseY/this.appScale });
          p.line(
            this.currentStroke.at(-2).x,
            this.currentStroke.at(-2).y,
            this.currentStroke.at(-1).x,
            this.currentStroke.at(-1).y
          )
        }
      }

      p.keyPressed = () => {
        console.log('keypressed registered');
        if (p.key == "m") {
          console.log("mode change via keyboard");
          if (this.currentMode == Modes.DRAW) {
            this.adminMode = true;
          }

          this.toggleMode(p);
        }

        if (this.adminMode && this.currentMode == Modes.SHOW) {
          if (p.keyCode === p.LEFT_ARROW) {
            console.log('prev drawing via arrow');
            this.prevDrawing();
          }
          if (p.keyCode === p.RIGHT_ARROW) {
            console.log('next drawing via arrow');
            this.nextDrawing();
          }
          if (p.key == "d") {
            console.log("d delete");
            // TODO: delete drawing
          }
        }
      }
    };

    this.p5SketchObject = new p5(s, 'sketch');
  }

  //-------------------- Mode & Mode Control ---------------------//
  // TODO: separate out toggleMode into individual controls with safety
  // Logic is too complex here, hard to read and understand 
  toggleMode = () => {
    if (this.currentMode == Modes.DRAW) { // draw -> submit -> show 
      this.vueContainer.showMode();
      this.currentMode = Modes.SUBMIT;
      this.renderBackground();
      this.timeEnteredShow = Date.now();

      // Set a timeout to return to draw mode after 30 seconds of Show 
      if (!this.adminMode) {
        setTimeout(() => { this.showModeSetup(); }, 2000); //goes to ShowMode in 2 seconds

        setTimeout(() => {
          let nowTime = Date.now();
          if (this.currentMode == Modes.SHOW && ((nowTime - this.timeEnteredShow) >= 30000)) {
            this.toggleMode();
          }
        }, showModeLength)
      } else {
        this.showModeSetup();
      }

    } else if (this.currentMode == Modes.SHOW) { // show mode -> draw mode 
      if (this.adminMode) {
        this.adminMode = false;
      }
      this.vueContainer.drawMode();
      this.nextImage(); // Move to next image after show
      this.currentMode = Modes.DRAW

      this.showModeTeardown();
    } else {
      throw Error("Unexpected toggle call during unsupported mode, likely Submit");
    }
  }

  showModeSetup = () => {
    // Get a max of maxDrawingsToShow previous drawings to show during show mode 
    this.drawingsForCurrentImage = this.drawingList.filter(d => d.imgName == this.loadedImages[this.currentImageIndex].name);
    this.currentImageDrawingIndex = 0;

    if (this.adminMode) {
      this.drawingOpacity = 255;
    } else {
      this.drawingOpacity = 0;
      if (this.drawingsForCurrentImage.length > maxDrawingsToShow) {
        this.drawingsForCurrentImage = this.drawingsForCurrentImage.slice(-(maxDrawingsToShow)); // only show the 5 latest images
      }
    }
    this.drawingColor = p.color(this.drawingsForCurrentImage[this.currentImageDrawingIndex].colorStr);
  
    this.currentMode = Modes.SHOW;
  }

  showModeTeardown = () => {
    this.currentImageDrawingIndex = 0;
    this.drawingOpacity = 0;
    this.drawingsForCurrentImage = [];
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

    if (!this.adminMode) {
      if (this.drawingOpacity < 255) {
        this.drawingOpacity+=2;
      } else {
        this.nextDrawing(p);
        this.drawingOpacity = 0;
      }
    }
  }

  nextDrawing = () => {
    this.currentImageDrawingIndex = this.currentImageDrawingIndex < this.drawingsForCurrentImage.length - 1 ? this.currentImageDrawingIndex + 1 : 0;
    this.drawingColor = this.p5SketchObject.color(this.drawingsForCurrentImage[this.currentImageDrawingIndex].colorStr);
  }

  prevDrawing = () => {
    this.currentImageDrawingIndex = this.currentImageDrawingIndex > 0 ? this.currentImageDrawingIndex - 1 : this.drawingsForCurrentImage.length - 1;
    this.drawingColor = this.p5SketchObject.color(this.drawingsForCurrentImage[this.currentImageDrawingIndex].colorStr);
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
      p.rect(0,0,canvasW, canvasH);
      this.flashOpacity = this.flashOpacity - 10;
      p.pop(0);
    }
  }

  //-------------------- Mode & Mode Control ---------------------//
  nextImage = () => {
    this.currentImageIndex = this.currentImageIndex >= this.loadedImages.length - 1 ? 0 : this.currentImageIndex + 1;
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
      this.toggleMode();
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
    // let d = p.dist(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
    let lastPoint = this.currentStroke.at(-1);


    let d = p.dist(lastPoint.x, lastPoint.y, p.mouseX/this.appScale, p.mouseY/this.appScale);

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