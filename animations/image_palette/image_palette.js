import * as THREE from 'three';


function getSquareTextMesh(
  text, size, fontSize='20pt', strokeWidth=3,
  strokeColor='black', fillColor='white',
  fontFamily='Quicksand'
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const scale = window.devicePixelRatio;
  canvas.width = Math.floor(size * scale);
  canvas.height = Math.floor(size * scale);
  ctx.scale(scale, scale);

  ctx.font = `${fontSize} ${fontFamily}`;
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = strokeColor;
  ctx.fillText(text, size / 2, size / 2)
  if (strokeWidth > 0) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    ctx.strokeRect(0, 0, size, size)
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true

  var material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  })
  var mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material)
  return mesh
}


function getTable(
  cells, cellToMesh, cellSize, cellMarginX=0, cellMarginY=cellMarginX
) {
  const numRows = cells.length;
  const numCols = Math.max(...cells.map(row => row.length));

  const group = new THREE.Group();
  const cellMeshes = [];

  let i, j;
  for (i = 0; i < numRows; i++) {
    const row = cells[i];
    cellMeshes.push([])
    for (j = 0; j < numCols; j++) {
      if (row.length <= j) {
        continue;
      }
      const cell = cells[i][j];
      const mesh = cellToMesh(cell);
      mesh.position.x = j*(cellSize + cellMarginX) + cellSize/2;
      mesh.position.y = - i*(cellSize + cellMarginY) - cellSize/2;
      mesh.position.z = 0;
      group.add(mesh);
      cellMeshes[i].push(mesh);
    }
  }

  return {
    group: group,
    meshes: cellMeshes
  };
}

function getNumberTable(
  numbers, cellSize, strokeWidth,
  cellMarginX=0,
  cellMarginY=cellMarginX,
  precision=2,
  strokeColor='black',
  fontSize=`${cellSize*.4}px`,
) {
  return getTable(
    numbers,
    cell => {
      const x = cell.toFixed(precision)
      return getSquareTextMesh(
        `${x}`, cellSize, fontSize,
        strokeWidth, strokeColor
      );
    },
    cellSize, cellMarginX, cellMarginY
  );
}


function getColorSquare(
  fillColor, size, strokeWidth=0, strokeColor='black',
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const scale = window.devicePixelRatio;
  canvas.width = Math.floor(size * scale);
  canvas.height = Math.floor(size * scale);
  ctx.scale(scale, scale);
  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, size, size)
  if (strokeWidth > 0) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.strokeRect(0, 0, size, size)
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true

  var material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  })
  var mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material)

  return mesh;
}


function getColorTable(
  colors, cellSize, strokeWidth=0, cellMarginX=0, cellMarginY=cellMarginX,
  strokeColor='black'
) {
  return getTable(
    colors,
    cell => getColorSquare(cell, cellSize, strokeWidth, strokeColor),
    cellSize,
    cellMarginX,
    cellMarginY,
  );
}


const floatToGray = (arr) => arr.map(row => row.map(x => `rgb(${x*255},${x*255},${x*255})`))
const uintToGray = (arr) => arr.map(row => row.map(x => `rgb(${x},${x},${x})`))
const idxToNumber = (idxs, palette) => idxs.map(row => row.map(idx => palette[idx]))


function runAnimation() {
  const container = document.getElementById('container');
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;

  const stepSize = 13;
  const maxValue = 100;
  const paletteTable = _.range(0, maxValue + 1, stepSize).map(x => _.range(x, Math.min(x + stepSize, maxValue + 1)).map(x => x/maxValue));
  const flatPalette = paletteTable.flat();

  const cellSize = 100;
  const colorIdxs = [
    [10, 90, 40],
    [100, 80, 30],
    [70, 10, 95],
  ];
  const numRows = colorIdxs.length;
  const numCols = Math.max(...colorIdxs.map(row => row.length));
  const numbers = idxToNumber(colorIdxs, flatPalette);

  const fov = 45;
  let camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 10000);
  const tableWidth = numCols * cellSize;
  const tableHeight = numRows * cellSize;

  let scene = new THREE.Scene();

  const {group: numberTable, meshes: numberMeshes} = getNumberTable(
    numbers, cellSize, 3, 0, 0, 2
  )
  scene.add(numberTable);

  const tableBox = new THREE.Box3();
  tableBox.setFromObject(numberTable);
  let tableCenter = new THREE.Vector3();
  tableBox.getCenter(tableCenter);
  let tableSize = new THREE.Vector3();
  tableBox.getSize(tableSize);

  // const colors = floatToGray(numbers);
  // const {group: colorTable, meshes: colorMeshes} = getColorTable(colors, cellSize)
  // colorTable.position.x = numberTable.position.x;
  // colorTable.position.y = numberTable.position.y + tableSize.y + 10;
  // scene.add(colorTable);

  const marginX = 20;
  const marginY = cellSize + marginX;
  const {
    group: paletteColorGroup,
    meshes: paletteColorMeshes
  } = getColorTable(floatToGray(paletteTable), cellSize, 0, marginX, marginY, 'black')

  const paletteBox = new THREE.Box3();
  paletteBox.setFromObject(paletteColorGroup);
  let paletteSize = new THREE.Vector3();
  paletteBox.getSize(paletteSize);

  paletteColorGroup.position.x = numberTable.position.x - paletteSize.x - 100;
  paletteColorGroup.position.y = numberTable.position.y + (paletteSize.y - tableSize.y) / 2;
  paletteColorGroup.position.z = numberTable.position.z;

  const {
    group: paletteNumberGroup,
    meshes: paletteNumberMeshes
  } = getNumberTable(paletteTable, cellSize, 0, marginX, marginY)
  paletteNumberGroup.position.x = paletteColorGroup.position.x;
  paletteNumberGroup.position.y = paletteColorGroup.position.y - cellSize;
  paletteNumberGroup.position.z = paletteColorGroup.position.z;

  const paletteGroup = new THREE.Group();
  paletteGroup.add(paletteColorGroup);
  paletteGroup.add(paletteNumberGroup);

  scene.add(paletteGroup);

  camera.position.z = 2500;
  camera.position.x = tableCenter.x;
  camera.position.y = tableCenter.y;

  let renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio)
  const renderEl = renderer.domElement;
  renderEl.style.position = 'absolute';
  renderEl.style.top = 0;
  renderEl.style.left = 0;
  container.appendChild(renderEl);
  renderer.domElement.style.margin = "auto"
  renderer.setSize(canvasWidth, canvasHeight);

  function render() {
    renderer.render(scene, camera);
  }
  render()

  const paletteDests = flatPalette.map(() => []);
  numbers.forEach((row, i) => {
    row.forEach((x, j) => {
      const paletteIdx = flatPalette.reduce((acc, currVal, currIdx, arr) => {
        return Math.abs(currVal - x) < Math.abs(arr[acc] - x) ? currIdx : acc;
      }, 0);
      paletteDests[paletteIdx].push([i, j]);
    });
  });

  const flatPaletteMeshes = paletteColorMeshes.flat();
  const tl = gsap.timeline({
    delay: 2,
    paused: true,
    onUpdate: render,
    defaults: {
      ease: "power2.inOut" 
    },
    onComplete: () => {
    }
  });
  paletteDests.forEach((dests, paletteIdx) => {
    const srcMesh = flatPaletteMeshes[paletteIdx];
    let srcCenter = new THREE.Vector3();
    srcMesh.getWorldPosition(srcCenter);

    dests.forEach(([i, j]) => {
      const srcClone = srcMesh.clone();

      const dstMesh = numberMeshes[i][j];
      let dstCenter = new THREE.Vector3();
      dstMesh.getWorldPosition(dstCenter);

      scene.add(srcClone);
      gsap.set(srcClone.position, {
        x: srcCenter.x,
        y: srcCenter.y,
        z: srcCenter.z,
      });
      tl.to(dstMesh.position, {
        z: srcCenter.z * 1.2,
        repeat: 1,
        yoyo: true,
        duration: 0.2,
      },
        `palette${paletteIdx}Scale`
      ).to(srcClone.position, {
        x: dstCenter.x,
        y: dstCenter.y,
        z: dstCenter.z + 1,
        duration: 1,
      },
        `palette${paletteIdx}Move`)
    });
  });
  tl.play();
}

window.addEventListener('load', function () {
  runAnimation();
})
