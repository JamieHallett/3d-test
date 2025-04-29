function initBuffers(gl, obj, usage) {
  const positionBuffer = initPositionBuffer(gl, buildPositionsCube(obj), usage);

  const textureCoordBuffer = initTextureBuffer(gl);

  const indexBuffer = initIndexBuffer(gl);

  const normalBuffer = initNormalBuffer(gl);

  return {
    position: positionBuffer,
    normal: normalBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}

function initManyCubeBuffers(
  gl,
  numCubes = 1,
  objs = [{ X: 0, Y: 0, Z: 0, size: 2 }],
  permanent = false,
  usage = gl.STATIC_DRAW,
  texture,
  highvisibility = false,
) {
  const buffers = [];
  const indexBuffer = initIndexBuffer(gl);
  const normalBuffer = initNormalBuffer(gl);
  const textureCoordBuffer = initTextureBuffer(gl);
  for (let i = 0; i < numCubes; i++) {
    buffers.push({
      position: initPositionBuffer(gl, buildPositionsCube(objs[i]), usage),
      //color: initColorBuffer(gl, alternatecolors),
      normal: normalBuffer,
      textureCoord: textureCoordBuffer,
      indices: indexBuffer,
      permanent,
      texture,
      highvisibility,
    });
  }
  return buffers;
}

function updateManyCubeBuffers(
  gl,
  objs = [
    {
      X: 0,
      Y: 0,
      Z: 0,
      getPos: () => [this.X, this.Y, this.Z],
      size: 2,
      buffers: {},
    },
  ],
  camerapos = [0, 0, 0],
  fov = 90,
) {
  const newobjs = [];
  const len = objs.length;
  for (let i = 0; i < len; i++) {
    const obj = objs[i];
    const objpos = obj.getPos ? obj.getPos() : [obj.X, obj.Y, obj.Z];
    newobjs.push(Object.assign({}, obj));
    newobjs[i].buffers.position = updatePositionBuffer(
      gl,
      obj.buffers.position,
      buildPositionsCube(
        obj.buffers.highvisibility // high visibility makes objects render larger when further away to make them easier to see or to give the appearance of glowing
          ? Object.assign({}, obj, {
              size: Math.max(
                (Math.pow(
                  (camerapos[0] - objpos[0]) ** 2 +
                    (camerapos[1] - objpos[1]) ** 2 +
                    (camerapos[2] - objpos[2]) ** 2,
                  0.25,
                ) *
                  obj.size *
                  fov) /
                  45,
                obj.size,
              ),
            })
          : obj,
      ),
    );
  }
  return newobjs;
}

function initPositionBuffer(gl, positionList, usage = gl.STATIC_DRAW) {
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.
  const positions = positionList || [
    // Front face
    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,

    // Back face
    -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0,

    // Top face
    -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

    // Right face
    1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,

    // Left face
    -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0,
  ];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), usage);

  return positionBuffer;
}

function updatePositionBuffer(gl, positionBuffer, positions) {
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(positions));
  return positionBuffer;
}

function initColorBuffer(gl, alternatecolors = false) {
  const faceColors = alternatecolors
    ? [
        [0.8, 0.8, 0.8, 1.0], // Front face: grey
        [0.8, 0.0, 0.0, 1.0], // Back face: red
        [0.0, 0.8, 0.0, 1.0], // Top face: green
        [0.0, 0.0, 0.8, 1.0], // Bottom face: blue
        [0.8, 0.8, 0.0, 1.0], // Right face: yellow
        [0.8, 0.0, 0.8, 1.0], // Left face: purple
      ]
    : [
        [1.0, 1.0, 1.0, 1.0], // Front face: white
        [1.0, 0.0, 0.0, 1.0], // Back face: red
        [0.0, 1.0, 0.0, 1.0], // Top face: green
        [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0], // Right face: yellow
        [1.0, 0.0, 1.0, 1.0], // Left face: purple
      ];

  // Convert the array of colors into a table for all the vertices.

  let colors = [];

  for (let j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];
    // Repeat each color four times for the four vertices of the face
    colors = colors.concat(c, c, c, c);
  }

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  return colorBuffer;
}

function initIndexBuffer(gl) {
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = [
    0,
    1,
    2,
    0,
    2,
    3, // front
    4,
    5,
    6,
    4,
    6,
    7, // back
    8,
    9,
    10,
    8,
    10,
    11, // top
    12,
    13,
    14,
    12,
    14,
    15, // bottom
    16,
    17,
    18,
    16,
    18,
    19, // right
    20,
    21,
    22,
    20,
    22,
    23, // left
  ];

  // Now send the element array to GL

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW,
  );

  return indexBuffer;
}

function initTextureBuffer(gl) {
  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  const textureCoordinates = [
    // Front
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Back
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Top
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Bottom
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Right
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Left
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  ];

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoordinates),
    gl.STATIC_DRAW,
  );

  return textureCoordBuffer;
}

function initNormalBuffer(gl) {
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

  const vertexNormals = [
    // Front
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

    // Back
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,

    // Top
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

    // Bottom
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,

    // Right
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,

    // Left
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
  ];

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexNormals),
    gl.STATIC_DRAW,
  );

  return normalBuffer;
}

function buildPositionsCube(obj = { X: 0, Y: 0, Z: 0, size: 2 }) {
  const { X, Y, Z, size } = obj;
  const radius = size / 2;
  const corners = [
    [X + radius, Y + radius, Z + radius],
    [X - radius, Y + radius, Z + radius],
    [X + radius, Y - radius, Z + radius],
    [X - radius, Y - radius, Z + radius],
    [X + radius, Y + radius, Z - radius],
    [X - radius, Y + radius, Z - radius],
    [X + radius, Y - radius, Z - radius],
    [X - radius, Y - radius, Z - radius],
  ];
  const positions = [
    // front face
    corners[3],
    corners[2],
    corners[0],
    corners[1],

    // back face
    corners[7],
    corners[5],
    corners[4],
    corners[6],

    // top face
    corners[5],
    corners[1],
    corners[0],
    corners[4],

    // bottom face
    corners[7],
    corners[6],
    corners[2],
    corners[3],

    // right face
    corners[6],
    corners[4],
    corners[0],
    corners[2],

    // left face
    corners[7],
    corners[3],
    corners[1],
    corners[5],
  ];
  return positions.flat();
}

export {
  initBuffers,
  buildPositionsCube,
  initManyCubeBuffers,
  updateManyCubeBuffers,
};
