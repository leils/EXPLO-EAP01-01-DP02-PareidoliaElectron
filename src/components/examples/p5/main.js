import p5 from 'p5';
import isElectron from 'is-electron';

var assetsURI;
if (typeof(process) != 'undefined' && isElectron() == true && (process.env.NODE_ENV != 'development')) {
  assetsURI = 'http://localhost:3000';
} else {
  assetsURI = '.';
}

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
const showPromptText =  "Did they see what you saw? \nTap the screen for a new image.";
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
          try {
            i.loadedImage = p.loadImage(i.path);
            this.loadedImages.push(i);
          } catch  {
            console.log('lol');
          }
          
        }
        // fetchJSONDrawings(); // TODO
      };

      p.setup = () => {
        p.createCanvas(1920, 1080);
        p.noCursor();
        p.frameRate(30);
        this.vertImage = p.loadImage(assetsURI + config.imagePath);
        this.drawTextIn = true;
      };

      p.draw = () => {
        p.smooth();
        p.image(this.vertImage, p.mouseX / this.appScale - (this.vertImage.width / 2), p.mouseY / this.appScale - (this.vertImage.height / 2));
        p.rectMode(p.CENTER);

        // draw once
        if (this.drawTextIn == true) {
          p.textFont(this.font);
          p.textSize(75);
          p.text('HI LEIA', 0, 75);
          this.drawTextIn = false;
        } 
      };

      p.reset = () => {
        p.clear();
        this.drawTextIn = true;
      };
    };

    this.p = new p5(s, 'sketch');
  }

  reset() {
    this.p.reset();
  }

  remove() {
    this.p.remove();
  }
}

export { Sketch };