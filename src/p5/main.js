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

// Prompts
const drawPromptText = "Do you see something in this image? Draw it!";
const showPromptText = "Did they see what you saw? \nTap the screen for a new image.";
const afterSubmitText = "Great! Let's see what some other people drew.";
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

/*--------------------- Buttons -------------------------*/
const buttonOffset = 100;
const buttonDeadZoneHeight = 200;

/*--------------------- END -------------------------*/

class Sketch {
  constructor(config, appScale, drawingData, updateDrawingData) {
    this.config = config;
    this.appScale = appScale;
    this.drawTextIn = 3;
    this.font;

    this.currentMode = Modes.DRAW;
    this.timeEnteredShow = 0;

    this.loadedImages = [];
    this.currentImageIndex = 0;
    this.currentColorIndex = 0;

    this.allButtons = [];
    this.buttonHeight;
    this.promptTextSize = 50; 

    this.drawingList = drawingData;
    this.updateDrawingData = updateDrawingData;
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

        this.buttonHeight = canvasH - 120;
        p.textSize(this.promptTextSize);
        p.textAlign(p.CENTER);
        p.strokeWeight(setStrokeWeight);
        p.stroke(colorList[this.currentColorIndex]);
        p.background('blue');

        this.renderBackground(p);
        this.buttonInit(p);
      };

      p.draw = () => {
        if (this.currentMode == Modes.SHOW) {
          this.renderShowModeFrame(p);
        }
        this.handleFlashAnimation(p);
        if (this.currentMode != Modes.SUBMIT) {
          this.drawPrompt(p);
        }
      };

      p.reset = () => {
        p.clear();
        this.nextImage(p);
        this.resetCanvas(p);
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
        // This is a hack to make sure the stroke starts where touch starts 
        p.pmouseX = p.mouseX/this.appScale;
        p.pmouseY = p.mouseY/this.appScale;

        if (this.currentMode == Modes.SHOW) {
          this.toggleMode(p);
        }
      }

      p.mouseDragged = () => {
        if (this.currentMode == Modes.DRAW && this.pointerLocationIsValid(p))
          p.line(p.pmouseX / this.appScale, p.pmouseY / this.appScale, p.mouseX / this.appScale, p.mouseY / this.appScale);
        this.currentStroke.push({ x: p.mouseX/this.appScale, y: p.mouseY/this.appScale });
      }
    };

    this.p5SketchObject = new p5(s, 'sketch');
  }

  //-------------------- Mode & Mode Control ---------------------//

  toggleMode = (p) => {
    if (this.currentMode == Modes.DRAW) { // draw -> submit -> show 
      for (var b of this.allButtons) { b.hide(); } // hide all buttons
      this.currentMode = Modes.SUBMIT;
      this.renderBackground(p);
      this.timeEnteredShow = Date.now();

      setTimeout(() => { this.showModeSetup(p); }, 2000); //goes to ShowMode in 2 seconds

      // Set a timeout to return to draw mode after 30 seconds of Show 
      setTimeout(() => {
        let nowTime = Date.now();
        if (this.currentMode == Modes.SHOW && ((nowTime - this.timeEnteredShow) >= 30000)) {
          this.toggleMode(p);
        }
      }, 30000)

    } else if (this.currentMode == Modes.SHOW) { // show mode -> draw mode 
      this.nextImage(p); // Move to next image after show
      for (var b of this.allButtons) { b.show(); } // show all buttons
      this.currentMode = Modes.DRAW

      this.showModeTeardown();
    } else {
      throw Error("Unexpected toggle call during unsupported mode, likely Submit");
    }
  }

  showModeSetup = (p) => {
    this.renderBackground(p);
    this.drawingsForCurrentImage = this.drawingList.filter(d => d.imgName == this.loadedImages[this.currentImageIndex].name);
    if (this.drawingsForCurrentImage.length > maxDrawingsToShow) {
      this.drawingsForCurrentImage = this.drawingsForCurrentImage.slice(-(maxDrawingsToShow)); // only show the 5 latest images
    }
    this.currentImageDrawingIndex = 0;
    this.drawingOpacity = 0;
    this.drawingColor = p.color(this.drawingsForCurrentImage[this.currentImageDrawingIndex].colorStr);
  
    this.currentMode = Modes.SHOW;
  }

  showModeTeardown = () => {
    this.currentImageDrawingIndex = 0;
    this.drawingOpacity = 0;
    this.drawingsForCurrentImage = [];
  }

  renderShowModeFrame = (p) => {
    this.renderBackground(p);
  
    p.push();
    let drawing = this.drawingsForCurrentImage[this.currentImageDrawingIndex];
    this.drawingColor.setAlpha(this.drawingOpacity);
    p.stroke(this.drawingColor);
    this.drawStrokes(p, drawing.strokes);
    p.pop();
  
    if (this.drawingOpacity < 255) {
      this.drawingOpacity+=2;
    } else {
      this.nextDrawing(p);
      this.drawingOpacity = 0;
    }
  }

  nextDrawing = (p) => {
    this.currentImageDrawingIndex = this.currentImageDrawingIndex < this.drawingsForCurrentImage.length - 1 ? this.currentImageDrawingIndex + 1 : 0;
    this.drawingColor = p.color(this.drawingsForCurrentImage[this.currentImageDrawingIndex].colorStr);
  }

  handleFlashAnimation = (p) => {
    if (this.flashOpacity > 0) {
      p.push();
      // Rendering submit text
      this.renderBackground(p);
      p.noStroke();
      p.fill('black');
      p.rectMode(p.CENTER);
      p.rect(canvasW/2, canvasH/2 - (this.promptTextSize/3), canvasW, 100);
      p.strokeWeight(3);
      p.stroke('black');
      p.fill('yellow');
      p.textAlign(p.CENTER);
      p.text(afterSubmitText, canvasW/2, canvasH/2);
      p.pop();
  
      p.push();
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

  buttonInit = (p) => {
    let totalWidth = 0;

    let undoButton = p.createButton("Undo");
    undoButton.mousePressed(()=>{this.undo(p)});
    undoButton.class("undoButton");
    undoButton.position(60, this.buttonHeight);
    this.allButtons.push(undoButton);


    let submitButton = p.createButton("Submit Your Drawing");
    submitButton.mousePressed(() => { this.submitDrawing(p)} );
    submitButton.class('submitButton');
    submitButton.position((canvasW-submitButton.width)/2 - 40, this.buttonHeight);
    this.allButtons.push(submitButton);


    // let nextButton = p.createImg("assets/arrow-forward.png");
    let nextButton = p.createButton("New Image");
    nextButton.mousePressed(() => {this.nextImage(p)} );
    nextButton.position(canvasW-300, this.buttonHeight);
    nextButton.class("nextButton");
    this.allButtons.push(nextButton);
  }

  drawPrompt = (p) => {
    // TODO incorporate submit mode into prompt drawing for clarity
    p.push();
    p.fill("black");
    p.noStroke();
    p.rectMode(p.CORNER);
    p.rect(0, canvasH - buttonDeadZoneHeight, canvasW, canvasH);

    p.strokeWeight(3);
    p.stroke('black');
    p.fill('yellow');
    if (this.currentMode == Modes.DRAW) {
      p.text(drawPromptText, canvasW / 2, canvasH - 150);
    } else {
      p.text(showPromptText, canvasW / 2, canvasH - 120);
    }
    p.pop();
  }

  nextImage = (p) => {
    this.currentImageIndex = this.currentImageIndex >= this.loadedImages.length - 1 ? 0 : this.currentImageIndex + 1;
    this.resetCanvas(p); // also remove the current drawings 
  }

  renderBackground = (p) => {
    p.image(this.loadedImages[this.currentImageIndex].loadedImage, 0, 0, canvasW, canvasH);
  }

  resetCanvas = (p) => {
    this.strokeList = [];
    this.renderBackground(p);
  }

  //-------------------- Strokes and Drawing ---------------------//
  submitDrawing = (p) => {
    if (this.strokeList.length > 0) {
      let d = new Drawing(this.loadedImages[this.currentImageIndex].name, this.currentImageIndex, colorList[this.currentColorIndex], this.strokeList);
      this.drawingList.push(d);
  
      this.flashOpacity = 255;
      this.strokeList = [];
      this.renderBackground(p);
      this.changeColor(p);
      this.toggleMode(p);
    }

    this.updateDrawingData(this.drawingList);
  }

  changeColor = (p) => {
    this.currentColorIndex = this.currentColorIndex >= colorList.length - 1 ? 0 : this.currentColorIndex + 1;
    p.stroke(colorList[this.currentColorIndex]);
  }

  endStroke = () => {
    // commit this stroke to the StrokeList
    if (this.currentStroke.length > 1) {
      this.strokeList.push(this.currentStroke);
    }

    //clear stroke for next touch
    this.currentStroke = [];
  }

  drawStrokes = (p, slist) => {
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

  pointerLocationIsValid = (p) => {
    let d = p.dist(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
    if (d > 100 || p.mouseY / this.appScale > (1920 - buttonDeadZoneHeight)) {
      return false;
    } else {
      return true;
    }
  }

  undo = (p) => {
    if (this.strokeList.length > 0) {
      this.strokeList.pop();
      this.renderBackground(p);
      this.drawStrokes(p, this.strokeList);
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