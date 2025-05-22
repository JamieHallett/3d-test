import {
  buildPositionsCube,
  initBuffers,
  initManyCubeBuffers,
  updateManyCubeBuffers,
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
  z: false,
  h: false,
  arrowup: false,
  arrowdown: false,
  arrowleft: false,
  arrowright: false,
};

const canvas = document.querySelector("#canvas");

// Initialize the GL context
const gl = canvas.getContext("webgl", {
  powerPreference: "high-performance",
});
console.log(gl.getContextAttributes());

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
  workers[workername].onerror = function (e) {
    console.log(e);
  };
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

    case "z":
      camera.fov = 10;
      camera.moveSens = 0.0005;
      break;
    case "x":
      camera.fov = 1;
      camera.moveSens = 0.00005;
      break;
    case "v":
      setFiring(true);
      break;
    case "g":
      makeprojectile(projecCannon);
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

    case "z":
      camera.fov = 90;
      camera.moveSens = 0.005;
      break;
    case "v":
      setFiring(false);
      break;
    case "h":
      console.log(camera.getRot());
      keyStatus.h = false;
      break;
    case "j":
      camera.invertMouse = !camera.invertMouse;
      break;

    case "t":
      artillery = {};
      break;
    case ",":
      const gl = canvas.getContext("webgl", {
        powerPreference: "high-performance",
      });
      new Player(
        undefined,
        "player",
        initManyCubeBuffers(
          gl,
          1,
          Object.assign({}, { size: 1 }),
          true,
          gl.DYNAMIC_DRAW,
          texture,
        )[0],
        1,
        -10 - playerID * 1.5,
        0,
        -10,
      );
      break;

    case "1":
      weapons.code = "a";
      break;
    case "2":
      weapons.code = "b";
      break;
    case "3":
      weapons.code = "c";
      break;
    case "4":
      weapons.code = "d";
      break;
    case "5":
      weapons.code = "slowtest";
      break;
    case "6":
      weapons.code = "fasttest";
      break;
    case "7":
      weapons.code = "squareofcubes";
      break;
    case "8":
      weapons.code = "cbutinaccurate";
      break;
    case "9":
      weapons.code = "fountain";
      break;

    default:
      //console.log("other key pressed:", event.key);
      keyStatus[event.key.toLowerCase()] = false;
      //console.log(keyStatus);
      break;
  }
});

document.addEventListener("fullscreenchange", (event) => {
  console.log("fullscreen changed, your position:", camera.getPos());
  if (document.fullscreenElement) {
    canvas.style.width = screen.width + "px";
    canvas.style.height = screen.height + "px";
    //gl.viewport(0, 0, screen.width, screen.height);
  } else {
    canvas.style.width = "640px";
    canvas.style.height = "480px";
    //gl.viewport(0, 0, 640, 480);
  }
});

canvas.addEventListener("click", async () => {
  await canvas.requestPointerLock({
    unadjustedMovement: true,
  });
  if (document.querySelector("#enableFullscreen").checked) {
    document.querySelector("#canvascontainer").requestFullscreen();
  }
});

canvas.addEventListener("mousemove", (event) => {
  // hold h to rotate the projectile cannon instead of the camera
  const obj = keyStatus.h ? projecCannon : camera;
  // press j to toggle invert rotation
  const horizModifier = camera.invertMouse ? -1 : 1;
  if (document.pointerLockElement === canvas) {
    obj.horizRotation -= event.movementX * camera.moveSens * horizModifier;
    obj.vertRotation -= event.movementY * camera.moveSens;
    if (obj.vertRotation > Math.PI / 2) {
      obj.vertRotation = Math.PI / 2;
    } else if (obj.vertRotation < -Math.PI / 2) {
      obj.vertRotation = -Math.PI / 2;
    }
  }
});

class Player {
  constructor(idOverride, name, buffers, size = 1, x = -10, y = 0, z = -10) {
    this.type = "player";
    this.id = idOverride || playerID++;
    this.name = name;
    this.score = 0;
    this.hp = 100;
    this.X = x;
    this.Y = y;
    this.Z = z;
    this.size = size;
    this.color = "#000000";
    players[this.id] = this;
    this.buffers = buffers;
  }
  disconnect() {
    delete players[this.id];
  }
  respawn() {
    this.hp = 100;
    this.X = Math.random() * 1000 - 500;
    this.Z = Math.random() * 1000 - 500;
  }
}

class Projectile {
  constructor(
    origin = { X: 0.0, Y: 0.0, Z: 0.0, id: "genericPlayer" },
    vel = [0.0, 0.0, 0.0],
    size,
    dmg,
    buffers,
  ) {
    this.type = "projectile";
    this.id = origin.id + "#" + projectileID;
    this.projecID = projectileID;
    this.X = origin.X;
    this.Y = origin.Y;
    this.Z = origin.Z;
    this.getPos = () => [this.X, this.Y, this.Z];
    this.vel = vel;
    this.size = size;
    this.dmg = dmg;
    this.ownerID = origin.id;
    artillery[origin.id + "#" + projectileID] = this;
    projectileID++; // projectileID is only incremented after (this is important)
    this.buffers = buffers;
  }
}

const frametime = document.querySelector("#frametime");
let cubeRotation = 0.0;
let renderDeltaTime = 0;
const loopfreq = 100; // measured in hz
let loopThen = Date.now();
const camera = {
  X: 5,
  Y: 5,
  Z: 10,
  getPos() {
    return [this.X, this.Y, this.Z];
  },
  horizRotation: 0.2,
  vertRotation: -0.3,
  getRot() {
    return [this.horizRotation, this.vertRotation];
  },
  get rot() {
    return [this.horizRotation, this.vertRotation];
  },
  fov: 90,
  moveSens: 0.005,
  invertMouse: false,
};
const projecCannon = {
  // the cannon is on the origin-facing corner of the floating cube
  X: -1000 + 50,
  Y: 1000 - 50,
  Z: -2000 + 50,
  getPos() {
    return [this.X, this.Y, this.Z];
  },
  /*
  // rotation is inverse of the camera's rotation
  get horizRotation() {
    return camera.horizRotation + Math.PI;
  },
  get vertRotation() {
    return -camera.vertRotation;
  },
  */
  horizRotation: 0.4525 + Math.PI,
  vertRotation: -0.3855,

  getRot() {
    return [this.horizRotation, this.vertRotation];
  },
  get rot() {
    return [this.horizRotation, this.vertRotation];
  },
  firing: false,
};
let projectileID = 0;
let playerID = 0;
let artillery = {};
const players = {};
let firing = false;
let canFire = true;
let firingIntervalID = 0;
const weapons = {
  code: "c", // this is the default weapon
  get current() {
    return weapons[weapons.code];
  },
  a: {
    rate: 4.16, // measured in hz
    interval: 240, // measured in ms
    dmg: 115,
    dmgrange: { start: 100, end: 225, endval: 100 },
    vel: 950, // measured in m/s
    auto: false,
    inacc: 0,
    projecMult: 1,
  },
  b: {
    rate: 9,
    interval: 110,
    dmg: 45,
    dmgrange: { start: 75, end: 150, endval: 35 },
    vel: 950,
    auto: true,
    inacc: 0,
    projecMult: 1,
  },
  c: {
    rate: 13,
    interval: 75,
    dmg: 35,
    dmgrange: { start: 50, end: 150, endval: 30 },
    vel: 950,
    auto: true,
    inacc: 0,
    projecMult: 1,
  },
  d: {
    rate: 2.16,
    interval: 463,
    dmg: 30,
    dmgrange: { start: 25, end: 75, endval: 20 },
    vel: 400,
    auto: false,
    inacc: 0.05, // measured in radians (but it breaks down at higher values)
    projecMult: 8,
  },
  slowtest: {
    rate: 4.16,
    interval: 240,
    dmg: 1000,
    dmgrange: { start: 25, end: 75, endval: 20 },
    vel: 23,
    auto: false,
    inacc: 0,
    projecMult: 1,
  },
  fasttest: {
    rate: 100,
    interval: 10,
    dmg: 1,
    dmgrange: { start: 25, end: 75, endval: 20 },
    vel: 23,
    auto: false,
    inacc: 0,
    projecMult: 1,
  },
  squareofcubes: {
    rate: 2,
    interval: 500,
    dmg: 1,
    dmgrange: { start: 25, end: 75, endval: 20 },
    vel: 100,
    auto: false,
    inacc: 0.005,
    projecMult: 100,
  },
  cbutinaccurate: {
    rate: 13,
    interval: 75,
    dmg: 35,
    dmgrange: { start: 50, end: 150, endval: 30 },
    vel: 950,
    auto: true,
    inacc: 0.000_5,
    projecMult: 1,
  },
  fountain: {
    rate: 20,
    interval: 50,
    dmg: 100,
    dmgrange: { start: 50, end: 150, endval: 30 },
    vel: 75,
    auto: true,
    inacc: 0.5,
    projecMult: 20,
  },
};

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel,
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image,
    );

    // WebGL1 has different requirements for power of 2 images
    // vs. non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function makeSimpleTexture(gl) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([192, 192, 192, 255]); // opaque light grey
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel,
  );

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

// Load texture
const texture = loadTexture(gl, "square.svg");
const projecTexture = loadTexture(
  canvas.getContext("webgl", {
    powerPreference: "high-performance",
  }),
  "projectile.svg",
);

function main() {
  /* more stuff 
  https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context
  */

  // make canvas 480p
  canvas.style.width = "640px";
  canvas.style.height = "480px";

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;

      // Apply lighting effect

      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  // Fragment shader program

  const fsSource = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    uniform sampler2D uSampler;

    void main(void) {
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

      gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
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
      vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
      textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix",
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
      normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
      uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
    },
  };

  // const floortexture = loadTexture(gl, "square.svg");
  // Flip image pixels into the bottom-to-top order that WebGL expects.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  //const buffers = initBuffers(gl, buildPositionsCube());

  // build the interesting structure
  const cubeBuffers = initManyCubeBuffers(
    gl,
    8,
    [
      { X: 0, Y: 0, Z: 0, size: 2 },
      { X: 0, Y: 0, Z: 3, size: 2 },
      { X: 0, Y: 3, Z: 0, size: 2 },
      { X: 0, Y: 3, Z: 3, size: 2 },
      { X: 3, Y: 0, Z: 0, size: 2 },
      { X: 3, Y: 0, Z: 3, size: 2 },
      { X: 3, Y: 3, Z: 0, size: 2 },
      { X: 3, Y: 3, Z: 3, size: 2 },
    ],
    true,
    gl.STATIC_DRAW,
    texture,
  );

  // build the floor cube
  cubeBuffers.push(
    initManyCubeBuffers(
      gl,
      1,
      [{ X: 0, Y: -5001, Z: 0, size: 10000 }],
      true,
      gl.STATIC_DRAW,
      texture,
    )[0],
  );

  // build the floating cube
  cubeBuffers.push(
    initManyCubeBuffers(
      gl,
      1,
      [{ X: -1000, Y: 1000, Z: -2000, size: 100 }],
      true,
      gl.STATIC_DRAW,
      texture,
    )[0],
  );

  let then = 0;

  setInterval(loop, 1000 / loopfreq);
  /*
  makeWorker(
    () => {
      onmessage = (e) => {
        function projectilemove(artillery, loopfreq) {
          //projectilemove goes here (if workers are used)
        }
        postMessage(projectilemove(e.data.artillery, e.data.loopfreq));
      };
    },
    (e) => {
      artillery = e.data;
    },
    "projectilemove",
  );
  */

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001; // convert to seconds
    renderDeltaTime = now - then;
    then = now;

    cameraMove(renderDeltaTime * (keyStatus.shift ? 10 : 1));

    // hold m to skip rendering
    if (keyStatus.m) {
      requestAnimationFrame(render);
      return;
    }

    frametime.innerText = `${(renderDeltaTime * 1000).toFixed(2).padStart(6, " ")}ms, ${(1 / renderDeltaTime).toFixed(1).padStart(5, " ")}fps`;

    const projecArray = updateManyCubeBuffers(
      gl,
      Object.values(artillery),
      camera.getPos(),
      camera.fov,
    );
    const projectileBuffers = projecArray.map((projec) => projec.buffers);
    const playerArray = updateManyCubeBuffers(
      gl,
      Object.values(players),
      camera.getPos(),
      camera.fov,
    );
    const playerBuffers = playerArray.map((player) => player.buffers);
    /* 
    initManyCubeBuffers(
      gl,
      projecArray.length,
      projecArray,
      false,
      gl.DYNAMIC_DRAW,
    );
    */

    const bufferArray = cubeBuffers.concat(projectileBuffers, playerBuffers);

    if (keyStatus.b) {
      console.log(bufferArray, projecArray); ////////////////
      console.log(projectileBuffers);
    }

    drawScene(
      gl,
      programInfo,
      camera.fov,
      camera.getRot(),
      camera.getPos(),
      bufferArray,
    );
    cubeRotation += renderDeltaTime;
    if (renderDeltaTime > 0.03) {
      console.log("frame drop", renderDeltaTime);
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();

function loop() {
  const now = Date.now();
  const deltaTime = (now - loopThen) / 1000;
  loopThen = now;

  // hold n to skip loop
  if (keyStatus.n) {
    return;
  }

  document.querySelector("#loopfreq").innerText =
    `${(1 / deltaTime).toFixed(1).padStart(5, " ")}hz, ${(deltaTime * 1000).toFixed(2).padStart(5, " ")}ms`;

  //cameraMove(1/loopfreq);
  //workers["projectilemove"].postMessage({ artillery, loopfreq });
  artillery = projectilemove(artillery, deltaTime);
  document.querySelector("#projecCount").innerText = Object.keys(artillery)
    .length.toFixed()
    .padStart(4, " ");
}

function cameraMove(speedmod) {
  const horizontal = keyStatus.a - keyStatus.d; // taking advantage of the fact that true == 1 and false == 0
  const vertical = keyStatus.w - keyStatus.s;
  const z = keyStatus.f - keyStatus.r;

  const horizRotation = keyStatus.arrowright - keyStatus.arrowleft;
  const vertRotation = keyStatus.arrowdown - keyStatus.arrowup;

  let speed = 10;

  speed /= Math.sqrt(Math.abs(horizontal) + Math.abs(vertical) + Math.abs(z));

  speed *= speedmod;

  if (horizontal || vertical || z) {
    camera.X -=
      speed *
      (horizontal * Math.cos(-camera.horizRotation) -
        vertical * Math.sin(-camera.horizRotation));
    camera.Z -=
      speed *
      (vertical * Math.cos(-camera.horizRotation) +
        horizontal * Math.sin(-camera.horizRotation));
    camera.Y -= z * speed;
  }
  if (horizRotation || vertRotation) {
    camera.horizRotation -= horizRotation * camera.moveSens * 5;
    camera.vertRotation -= vertRotation * camera.moveSens * 5;
    if (camera.vertRotation > Math.PI / 2) {
      camera.vertRotation = Math.PI / 2;
    } else if (camera.vertRotation < -Math.PI / 2) {
      camera.vertRotation = -Math.PI / 2;
    }
    //console.log(camera.horizRotation, camera.vertRotation);
  }
}

function setFiring(startfire) {
  if (!firing && startfire && canFire) {
    // if not already firing and can fire
    const currentWeapon = weapons.current;
    makeprojectile(camera); // fire 1st projectile
    firingIntervalID = setInterval(
      // set interval for firing
      function () {
        makeprojectile(camera); // fire next projectile(s)
        canFire = false; // cannot fire as it has fired just now
        setTimeout(() => {
          canFire = true;
        }, currentWeapon.interval); // can now fire as fire rate has passed
      },
      currentWeapon.interval,
    );
    firing = true;
    canFire = false; // cannot fire as it has fired just now
    setTimeout(() => {
      canFire = true;
    }, currentWeapon.interval); // can now fire as fire rate has passed
  } else if (!startfire) {
    // stop firing
    clearInterval(firingIntervalID);
    firing = false;
  }
}

function makeprojectile(
  origin = { X: 0, Y: 0, Z: 0, rot: [0, 0], id: "no_owner" },
) {
  //camera.vertRotation+=(Math.random())*0.1; // recoil
  const gl = canvas.getContext("webgl", {
    powerPreference: "high-performance",
  });
  const weapon = weapons.current;
  const sin_theta = Math.sin(origin.rot[0]);
  const cos_theta = Math.cos(origin.rot[0]);
  const sin_phi = Math.sin(origin.rot[1]);
  const cos_phi = Math.cos(origin.rot[1]);
  const velY = weapon.vel * -cos_theta * cos_phi;
  const velX = weapon.vel * -sin_theta * cos_phi;
  const velZ = weapon.vel * sin_phi;
  const randomlist = []; // random numbers used for randomising projectile inaccuracy saved here
  if (weapon.inacc != 0) {
    const perpendicular_vert = [
      weapon.vel * -sin_theta * sin_phi, //sin_theta*sin_phi,// * -velZ,
      weapon.vel * -cos_theta * sin_phi, //cos_theta*sin_phi,// * -velZ,
      -Math.sqrt(velX ** 2 + velY ** 2),
    ]; // [x, y, z]
    const perpendicularHoriz = [
      cos_theta * weapon.vel,
      -sin_theta * weapon.vel,
    ]; // [x,y]
    const len = weapon.projecMult;
    for (let i = 0; i < len; i++) {
      // there can only be multiple projectiles if there is an inaccuracy, because it would just act as 1 projectile if 100% accurate
      const randomVert = Math.random();
      const randomHoriz = Math.random();
      randomlist.push(randomVert, randomHoriz); // add to randomlist to send to server (if multiplayer)
      const randomInaccVert = randomVert * weapon.inacc * 2 - weapon.inacc;
      const randomInaccHoriz = randomHoriz * weapon.inacc * 2 - weapon.inacc;

      console.log([
        velX +
          perpendicularHoriz[0] * randomInaccHoriz +
          perpendicular_vert[0] * randomInaccVert,
        velY +
          perpendicularHoriz[1] * randomInaccHoriz +
          perpendicular_vert[1] * randomInaccVert,
        velZ + perpendicular_vert[2] * randomInaccVert,
      ]);

      new Projectile(
        origin,
        [
          velX +
            perpendicularHoriz[0] * randomInaccHoriz +
            perpendicular_vert[0] * randomInaccVert,
          velY +
            perpendicularHoriz[1] * randomInaccHoriz +
            perpendicular_vert[1] * randomInaccVert,
          velZ + perpendicular_vert[2] * randomInaccVert,
        ],
        0.1,
        weapon.dmg,
        initManyCubeBuffers(
          gl,
          1,
          Object.assign({}, origin, [{ size: 0.1 }]),
          true,
          gl.DYNAMIC_DRAW,
          projecTexture,
          true, // projectiles are high visibility
        )[0],
      );
    }
  } else {
    // if weapon is inaccurate, projectile will be created in the for loop above
    new Projectile(
      origin,
      [velX, velY, velZ],
      0.1,
      weapon.dmg,
      initManyCubeBuffers(
        gl,
        1,
        Object.assign({}, origin, { size: 0.1 }),
        true,
        gl.DYNAMIC_DRAW,
        projecTexture,
        true, // projectiles are high visibility
      )[0],
    );
  }
  // console.log(artillery); /////////////////////////////////////////
}

function projectilemove(artillery, deltaTime) {
  // also checks collision with players
  const deletionList = [];
  Object.values(artillery).forEach((projectile) => {
    const collidedPlayers = [];
    for (const player of Object.values(players)) {
      // check all players for collision, add collided to array
      if (collisionPredict(projectile, player, deltaTime)) {
        // add player to collided if hit
        collidedPlayers.push(player);
      }
    }
    for (const i in collidedPlayers) {
      // do not hit owner
      if (collidedPlayers[i].id == projectile.ownerID) {
        collidedPlayers.splice(i, 1);
        break;
      }
    }

    // if players are collided, continue
    if (collidedPlayers.length > 0) {
      deletionList.push(projectile.id); // schedule projectile for deletion
      let closestTarget;
      // see which target is closest
      collidedPlayers.forEach((target) => {
        // if first in the list, set it as the closest for now
        if (closestTarget == undefined) {
          closestTarget = target;
          return;
        }

        // if closer, set as closest (for now)
        if (
          // no need to sqrt for distance because we can compare the squares of the distances
          (target.X - projectile.X) ** 2 +
            (target.Y - projectile.Y) ** 2 +
            (target.Z - projectile.Z) ** 2 <
          (closestTarget.X - projectile.X) ** 2 +
            (closestTarget.Y - projectile.Y) ** 2 +
            (closestTarget.Z - projectile.Z) ** 2
        ) {
          closestTarget = target;
          return;
        }
      });
      // do damage to closest target
      closestTarget.hp -= projectile.dmg;
      console.log("hit player", closestTarget.id, "for", closestTarget.hp);
      if (closestTarget.hp <= 0) {
        // if player is dead, remove it
        closestTarget.disconnect();
      }
    }

    // do movement after collision check
    projectile.X += projectile.vel[0] * deltaTime;
    projectile.Y += projectile.vel[2] * deltaTime;
    projectile.Z += projectile.vel[1] * deltaTime;

    // do gravity
    projectile.vel[2] -= 10 * deltaTime;
  });
  deletionList.forEach((id) => {
    delete artillery[id];
  });
  return artillery;
}

function collision(obj1, obj2, obj1IsPoint = false) {
  const diffX = obj1.X - obj2.X;
  const diffY = obj1.Y - obj2.Y;
  const dist = Math.sqrt(diffX ** 2 + diffY ** 2);
  if (dist > obj1.size + obj2.size) {
    return false;
  } // return if objects are way too far for collision
  if (obj1IsPoint) {
    if (
      obj1.X > obj2.X - obj2.size / 2 &&
      obj1.X < obj2.X + obj2.size / 2 &&
      obj1.Y > obj2.Y - obj2.size / 2 &&
      obj1.Y < obj2.Y + obj2.size / 2
    ) {
      // true if obj1's centre is within bounds of obj2
      return true;
    }
  } else {
    if (
      obj1.X + obj1.size / 2 > obj2.X - obj2.size / 2 &&
      obj1.X - obj1.size / 2 < obj2.X + obj2.size / 2 &&
      obj1.Y + obj1.size / 2 > obj2.Y - obj2.size / 2 &&
      obj1.Y - obj1.size / 2 < obj2.Y + obj2.size / 2
    ) {
      // true if obj1's bounds are within bounds of obj2
      return true;
    }
  }
  return false;
}

function collisionPredict(obj1, obj2, deltaTime) {
  // here obj1 is always a point, and obj2 is assumed to be stationary
  const diffX = obj1.X - obj2.X;
  const diffY = obj1.Y - obj2.Y;
  const diffZ = obj1.Z - obj2.Z;

  // if objects are already colliding, return true
  if (collision(obj1, obj2, true)) {
    return true;
  }

  //const horizdist = Math.sqrt(diffX ** 2 + diffY ** 2);
  const dist = Math.sqrt(diffX ** 2 + diffY ** 2 + diffZ ** 2);
  const spd = Math.sqrt(obj1.vel[0] ** 2 + obj1.vel[1] ** 2 + obj1.vel[2] ** 2);

  // if obj1 cannot reach obj2 in time, return false
  if (dist > spd * deltaTime) {
    return false;
  }

  const corners = [
    {
      X: diffX - obj2.size / 2,
      Y: diffY - obj2.size / 2,
      Z: diffZ - obj2.size / 2,
    },
    {
      X: diffX + obj2.size / 2,
      Y: diffY - obj2.size / 2,
      Z: diffZ - obj2.size / 2,
    },
    {
      X: diffX - obj2.size / 2,
      Y: diffY + obj2.size / 2,
      Z: diffZ - obj2.size / 2,
    },
    {
      X: diffX + obj2.size / 2,
      Y: diffY + obj2.size / 2,
      Z: diffZ - obj2.size / 2,
    },
    {
      X: diffX - obj2.size / 2,
      Y: diffY - obj2.size / 2,
      Z: diffZ + obj2.size / 2,
    },
    {
      X: diffX + obj2.size / 2,
      Y: diffY - obj2.size / 2,
      Z: diffZ + obj2.size / 2,
    },
    {
      X: diffX - obj2.size / 2,
      Y: diffY + obj2.size / 2,
      Z: diffZ + obj2.size / 2,
    },
    {
      X: diffX + obj2.size / 2,
      Y: diffY + obj2.size / 2,
      Z: diffZ + obj2.size / 2,
    },
  ];

  const notDotProducts = [[], [], []];

  // this calculates if velocity vector is clockwise or counterclockwise from the corner vector (not a dot product)
  for (let i = 0; i < 4; i++) {
    notDotProducts[0].push(
      Math.sign(corners[i].X * obj1.vel[2] - corners[i].Y * obj1.vel[0]),
    );
  }
  for (let i = 0; i < 8; i += 2) {
    notDotProducts[1].push(
      Math.sign(corners[i].Y * obj1.vel[1] - corners[i].Z * obj1.vel[2]),
    );
  }
  for (const i of [0, 1, 4, 5]) {
    notDotProducts[2].push(
      Math.sign(corners[i].Z * obj1.vel[0] - corners[i].X * obj1.vel[1]),
    );
  }

  for (let i = 0; i < 3; i++) {
    // if corner angles are only clockwise or only counterclockwise of velocity vector, return false
    if (new Set(notDotProducts[i]).size <= 1) {
      console.log("wrong direction", notDotProducts[i], i);
      return false;
    }
  }
  return true; // if velocity vector goes in between all corners, it will collide with the object
}
