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
    this.buttonInfo;

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

        this.fetchJSONDrawings(); 


        this.buttonInfo = [ 
          {
            label: "Undo",
            clickFunct: () => {
              console.log('clicked undo');
              this.undo(p);
            } // ... this needs to get P passed to it somehow 
          }, 
          {
            label: "Submit",
            clickFunct: this.submitDrawing,
            className: "submitButton"
          }, 
          {
            label: "Next Image",
            clickFunct: this.nextImage
          }
        ]
      };

      p.setup = () => {
        // createMetaTag();
        p.createCanvas(canvasW, canvasH);

        this.buttonHeight = canvasH - 120;
        this.promptTextSize = Math.floor(canvasW / 21);
        p.textSize(this.promptTextSize);
        p.textAlign(p.CENTER);
        p.strokeWeight(setStrokeWeight);
        p.stroke(colorList[this.currentColorIndex]);
        p.background('blue');

        this.renderBackground(p);

        // let b = createButton("undo");
        // b.mousePressed(() =>{ this.undo(p)});


        this.buttonInit(p);
      };

      p.draw = () => {
        if (p.currentMode == Modes.SHOW) {
          renderShowModeFrame(p);
        }
        this.handleFlashAnimation(p);
        if (p.currentMode != Modes.SUBMIT) {
          this.drawPrompt(p); 
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

        if(this.currentMode == Modes.SHOW) { 
           this.toggleMode();
        }
      }


      p.mouseDragged = () => {
        if (this.currentMode == Modes.DRAW && this.pointerLocationIsValid(p))
          p.line(p.pmouseX / this.appScale, p.pmouseY/this.appScale, p.mouseX/this.appScale, p.mouseY/this.appScale);
        this.currentStroke.push({ x: p.mouseX, y: p.mouseY });
      }
    };

    this.p5SketchObject = new p5(s, 'sketch');
  }

  //-------------------- Mode & Mode Control ---------------------//

  toggleMode = (p) => {
    if (this.currentMode == Modes.DRAW) { // draw -> submit -> show 
      for (b of this.allButtons) { b.hide(); } // hide all buttons
      this.currentMode = Modes.SUBMIT;
      this.renderBackground(p);
  
      setTimeout(() => { this.showModeSetup(); },2000); //goes to ShowMode in 2 seconds
  
      // Set a timeout to return to draw mode after 30 seconds
      setTimeout(() => {
        if(this.currentMode == Modes.SHOW) {
          this.toggleMode(p);
        }
      }, 30000)
  
    } else if (this.currentMode == Modes.SHOW) { // show mode -> draw mode 
      this.nextImage(); // Move to next image after show
      for (b of this.allButtons) { b.show(); } // show all buttons
      this.currentMode = Modes.DRAW
  
      this.showModeTeardown();
    } else {
      throw Error("Unexpected toggle call during unsupported mode, likely Submit");
    }
  }

  buttonInit = (p) => {
    let totalWidth = 0;

    //initialize all buttons, but don't place them yet
    for (var i=0; i < this.buttonInfo.length; i++) {
      let bInfo = this.buttonInfo[i];
      let newButton = p.createButton(bInfo.label);
      if (bInfo.hasOwnProperty("className")) {
        newButton.class(bInfo.className);
      }
      newButton.mousePressed(bInfo.clickFunct);
  
      totalWidth += newButton.width;
      this.allButtons.push(newButton);
    }
  
    // centering the buttons on-screen
    totalWidth += (this.allButtons.length - 1) * buttonOffset;
    let spaceOffset = (canvasW - totalWidth)/2;
  
    for (var b of this.allButtons) {
      b.position(spaceOffset, this.buttonHeight);
      spaceOffset += (buttonOffset + b.width);
    }
  }

  renderShowModeFrame = () => {
    //todo
  }

  handleFlashAnimation = () => {
    //todo
  }

  drawPrompt = () => {
    //todo
  }

  showModeSetup = () => {
    //todo
  }

  nextImage = () => {
    //todo
  }

  renderBackground = (p) => { 
    p.image(this.loadedImages[this.currentImageIndex].loadedImage, 0, 0, canvasW, canvasH);
  }
 
  //-------------------- Strokes and Drawing ---------------------//
  fetchJSONDrawings = () => {
    //todo
  }

  submitDrawing = () => {
    //todo
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