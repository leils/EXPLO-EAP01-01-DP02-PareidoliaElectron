import p5 from 'p5';
import isElectron from 'is-electron';

var assetsURI;
if (typeof (process) != 'undefined' && isElectron() == true && (process.env.NODE_ENV != 'development')) {
  assetsURI = 'http://localhost:3000';
} else {
  assetsURI = '.';
}

const canvasW = 1080;
const canvasH = 1920;

/*--------------------- Pareidolia - P5 Start -------------------------*/
// Background images 
class imageStruct {
  constructor(imgName, path) {
    this.name = imgName;
    this.path = path;
    this.loadedImage;
  }
}

const imgPathBase = "assets/backgroundImages/"; // TODO: IMAGE HANDLING WILL CHANGE
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
const afterSubmitText = "Great! Let's see what other people drew.";
/*--------------------- Drawings variables -------------------------*/
/* 
 * class Drawing 
 * {String} drawing.colorStr
 * {Array.Array{x:number, y:number}} drawing.strokes
*/
class Drawing {
  constructor(imgName, imgIndex, colorStr, strokes) {
    this.imgName = imgName;
    this.imgIndex = imgIndex;
    this.colorStr = colorStr;
    this.strokes = strokes;
  }
}
const drawingStorePath = "drawings.json"; // TODO: change storage path

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

// const buttonInfo = [ 
//   {
//     label: "Undo",
//     clickFunct: undo
//   }, 
//   {
//     label: "Submit",
//     clickFunct: submitDrawing,
//     className: "submitButton"
//   }, 
//   {
//     label: "Next Image",
//     clickFunct: nextImage
//   }
// ]


/*--------------------- END -------------------------*/

class Sketch {
  constructor(config, appScale) {
    this.config = config;
    this.appScale = appScale;
    this.drawTextIn = 3;
    this.font;

    this.currentMode = Modes.DRAW;

    this.loadedImages = [];
    this.currentImageIndex = 0;
    this.currentColorIndex = 0;

    this.allButtons = [];
    this.buttonHeight;
    this.promptTextSize = 50; //Gets rewritten based on window width 

    this.drawingList = [];
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

        // fetchJSONDrawings(); // TODO
      };

      p.setup = () => {
        // createMetaTag();
        p.createCanvas(canvasW, canvasH);

        this.buttonHeight = window.innerHeight - 120;
        this.promptTextSize = Math.floor(window.innerWidth / 21);
        p.textSize(this.promptTextSize);
        p.textAlign(p.CENTER);
        p.strokeWeight(setStrokeWeight);
        p.stroke(colorList[this.currentColorIndex]);
        p.background('blue');

        this.renderBackground(p);
        // buttonInit();
      };

      p.draw = () => {
        if (p.currentMode == Modes.SHOW) {
          // renderShowModeFrame();
        }
        // handleFlashAnimation();
        if (p.currentMode != Modes.SUBMIT) {
          // drawPrompt(); 
        }
      };

      p.reset = () => {
        p.clear();
        this.renderBackground(p);
      };

      p.mouseReleased = () => {
        if(this.currentMode == Modes.DRAW) {
          this.endStroke();
        }
      }

      p.touchEnded = () => {
        if(this.currentMode == Modes.DRAW) {
          this.endStroke();
        }
      }

      p.touchStarted = () => {
        // touch functionality means the mouse can "jump" across the screen 
        // This is a hack to make sure the stroke starts where touch starts 
        p.pmouseX = p.mouseX;
        p.pmouseY = p.mouseY;

        // if(this.currentMode == Modes.SHOW) { TODO
        //    toggleMode();
        // }
      }


      p.mouseDragged = () => {
        if (this.currentMode == Modes.DRAW && this.pointerLocationIsValid(p))
          p.line(p.pmouseX / this.appScale, p.pmouseY/this.appScale, p.mouseX/this.appScale, p.mouseY/this.appScale);
        this.currentStroke.push({ x: p.mouseX, y: p.mouseY });
      }
    };

    this.p5SketchObject = new p5(s, 'sketch');
  }

  renderBackground = (p) => { 
    p.image(this.loadedImages[this.currentImageIndex].loadedImage, 0, 0, canvasW, canvasH);
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
          p.line(lastPoint.x / this.appScale, lastPoint.y/this.appScale, currentPoint.x/this.appScale, currentPoint.y/this.appScale);
        } 
      }
    }
  }

  pointerLocationIsValid = (p) => {
    let d = p.dist(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
    if (d > 100 || p.mouseY/this.appScale > (1920 - buttonDeadZoneHeight)) {
      return false;
    } else {
      return true;
    }
  }

  undo = (p) => {
    if (this.strokeList.length > 0) {
      this.renderBackground(p); 
      this.drawStrokes(p, this.strokeList); 
    }
  }

  reset() {
    this.p5SketchObject.reset();
  }

  remove() {
    this.p5SketchObject.remove();
  }
}

export { Sketch };