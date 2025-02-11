import {
  buildPositionsCube,
  initBuffers,
  initManyCubeBuffers,
} from "./init-buffers.js";
import { drawScene } from "./draw-scene.js";

const workers = {
  a: undefined,
};

const keyStatus = {
  w: false,
  a: false,
  s: false,
  d: false,
  r: false,
  f: false,
  arrowup: false,
  arrowdown: false,
  arrowleft: false,
  arrowright: false,
};

function button() {
  fetch("text.txt")
    .then(function (res) {
      return res.text();
    })
    .then(function (data) {
      //console.log(data);
      alert(data);
    });
}

function button2() {
  makeWorker(
    function () {
      for (let i = 4; i > 0; i--) {
        postMessage(`press ok ${i} more times`);
      }
    },
    function (e) {
      alert(e.data);
    },
    "a",
  );
}

function makeWorker(workerfunc, receivefunc, workername) {
  // Build a worker from an anonymous function body
  let blobURL = URL.createObjectURL(
    // Create a temporary url to the blob of the worker
    new Blob(["(", workerfunc.toString(), ")()"], {
      // When the blob's code is run, it will call workerfunc
      type: "application/javascript",
    }),
  );
  workers[workername] = new Worker(blobURL); // Use the url to create the worker
  workers[workername].onmessage = receivefunc; // Set receivefunc to be called when the worker sends a message
  // Won't be needing this anymore
  URL.revokeObjectURL(blobURL);
}

document.addEventListener("keydown", (event) => {
  //console.log(event.key);
  switch (event.key.toLowerCase()) {
    case "w":
      keyStatus.w = true;
      break;
    case "a":
      keyStatus.a = true;
      break;
    case "s":
      keyStatus.s = true;
      break;
    case "d":
      keyStatus.d = true;
      break;
    case "r":
      keyStatus.r = true;
      break;
    case "f":
      keyStatus.f = true;
      break;

    default:
      keyStatus[event.key.toLowerCase()] = true;
      break;
  }
});
document.addEventListener("keyup", (event) => {
  switch (event.key.toLowerCase()) {
    case "w":
      keyStatus.w = false;
      break;
    case "a":
      keyStatus.a = false;
      break;
    case "s":
      keyStatus.s = false;
      break;
    case "d":
      keyStatus.d = false;
      break;
    case "r":
      keyStatus.r = false;
      break;
    case "f":
      keyStatus.f = false;
      break;

    default:
      //console.log("other key pressed:", event.key);
      keyStatus[event.key.toLowerCase()] = false;
      //console.log(keyStatus);
      break;
  }
});

const frametime = document.querySelector("#frametime");
let cubeRotation = 0.0;
let deltaTime = 0;
const camera = {
  X: 0,
  Y: 0,
  Z: -5,
  getPos() {
    return [this.X, this.Y, this.Z];
  },
  horizRotation: 0,
  vertRotation: 0,
  getRot() {
    return [this.horizRotation, this.vertRotation];
  },
};

function main() {
  /* more stuff 
  https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
  */
  const canvas = document.querySelector("#canvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

  // Fragment shader program

  const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;

  //
  // Initialize a shader program, so WebGL knows how to draw our data
  //
  function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert(
        `Unable to initialize the shader program: ${gl.getProgramInfoLog(
          shaderProgram,
        )}`,
      );
      return null;
    }

    return shaderProgram;
  }

  //
  // creates a shader of the given type, uploads the source and
  // compiles it.
  //
  function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(
        `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
      );
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVertexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix",
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl, buildPositionsCube());
  const bufferArray = initManyCubeBuffers(gl, 8, [
    { X: 0, Y: 0, Z: 0, size: 2 },
    { X: 0, Y: 0, Z: 3, size: 2 },
    { X: 0, Y: 3, Z: 0, size: 2 },
    { X: 0, Y: 3, Z: 3, size: 2 },
    { X: 3, Y: 0, Z: 0, size: 2 },
    { X: 3, Y: 0, Z: 3, size: 2 },
    { X: 3, Y: 3, Z: 0, size: 2 },
    { X: 3, Y: 3, Z: 3, size: 2 },
  ]);

  let then = 0;

  setInterval(function () {
    const horizontal = keyStatus.a - keyStatus.d; // taking advantage of the fact that true == 1 and false == 0
    const vertical = keyStatus.w - keyStatus.s;
    const z = keyStatus.r - keyStatus.f;

    const horizRotation = keyStatus.arrowright - keyStatus.arrowleft;
    const vertRotation = keyStatus.arrowdown - keyStatus.arrowup;

    let speed = 0.1;

    speed /= Math.abs(horizontal) + Math.abs(vertical) + Math.abs(z);

    if (horizontal || vertical || z) {
      camera.X +=
        speed *
        (horizontal * Math.cos(camera.horizRotation) -
          vertical * Math.sin(camera.horizRotation));
      camera.Z +=
        speed *
        (vertical * Math.cos(camera.horizRotation) +
          horizontal * Math.sin(camera.horizRotation));
      camera.Y += z * speed;
    }
    if (horizRotation || vertRotation) {
      camera.horizRotation += horizRotation * 0.05;
      camera.vertRotation += vertRotation * 0.05;
      console.log(camera.horizRotation, camera.vertRotation);
    }
  }, 10);

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001; // convert to seconds
    deltaTime = now - then;
    then = now;

    frametime.innerText = `${(deltaTime * 1000).toFixed(1)}ms, ${(1 / deltaTime).toFixed(1)}fps`;

    drawScene(
      gl,
      programInfo,
      buffers,
      camera.getRot(),
      camera.getPos(),
      bufferArray,
    );
    cubeRotation += deltaTime;

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();
