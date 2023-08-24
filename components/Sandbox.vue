<script setup lang="ts">
import { shallowRef, onMounted } from 'vue';

import * as THREE from 'three';
import TWEEN from 'three/addons/libs/tween.module.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import _ from 'lodash';
import { gsap } from "gsap";

const containerRef = shallowRef();


function getSquareTextMesh(
  text, size, fontSize='20pt', strokeWidth=3, strokeColor='black',
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
  cells, cellToMesh, cellSize, cellMargin=0
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
      mesh.position.x = j*(cellSize + cellMargin) + cellSize/2;
      mesh.position.y = - i*(cellSize + cellMargin) - cellSize/2;
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
  cellMargin=0,
  strokeColor='black',
  fontSize=`${cellSize*.4}px`,
  precision=2
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
    cellSize, cellMargin
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
  colors, cellSize, strokeWidth=0, cellMargin=0,
  strokeColor='black'
) {
  return getTable(
    colors,
    cell => getColorSquare(cell, cellSize, strokeWidth, strokeColor),
    cellSize,
    cellMargin
  );
}


onMounted(() => {
  const container = containerRef.value;

  const slideContent = document.getElementById('slide-content')
  const canvasWidth = parseInt(slideContent.style.width);
  const canvasHeight = parseInt(slideContent.style.height);

  const cellSize = 100;
  const numbers = [
    [0.1, 0.9, 0.4],
    [1.0, 0.8, 0.2],
    [0.3, 0.0, 0.9],
  ];
  const numRows = numbers.length;
  const numCols = Math.min(...numbers.map(row => row.length));

  const fov = 45;
  let camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 10000);
  const tableWidth = numCols * cellSize;
  const tableHeight = numRows * cellSize;

  let scene = new THREE.Scene();

  const {group: numberTable, meshes: numberMeshes} = getNumberTable(
    numbers, cellSize, 3,
  )
  scene.add(numberTable);

  const tableBox = new THREE.Box3();
  tableBox.setFromObject(numberTable);
  let tableCenter = new THREE.Vector3();
  tableBox.getCenter(tableCenter);
  let tableSize = new THREE.Vector3();
  tableBox.getSize(tableSize);

  const toGray = (arr) => arr.map(row => row.map(x => `rgb(${x*255},${x*255},${x*255})`))

  // const colors = toGray(numbers);
  // const {group: colorTable, meshes: colorMeshes} = getColorTable(colors, cellSize)
  // colorTable.position.x = numberTable.position.x;
  // colorTable.position.y = numberTable.position.y + tableSize.y + 10;
  // scene.add(colorTable);

  const paletteValues = [_.range(0.0, 1.1, 0.1)];

  const margin = 20;
  const {group: paletteColorTable, meshes: paletteColorMeshes} = getColorTable(toGray(paletteValues), cellSize, 0, margin, 'black')

  const paletteBox = new THREE.Box3();
  paletteBox.setFromObject(paletteColorTable);
  let paletteSize = new THREE.Vector3();
  paletteBox.getSize(paletteSize);

  paletteColorTable.position.x = numberTable.position.x - paletteSize.x / 2 + tableSize.x / 2;
  paletteColorTable.position.y = numberTable.position.y - tableSize.y - 150;
  paletteColorTable.position.z = 200;
  scene.add(paletteColorTable);

  const {group: paletteNumberTable, meshes: paletteNumberMeshes} = getNumberTable(paletteValues, cellSize, 0, margin)
  paletteNumberTable.position.x = paletteColorTable.position.x;
  paletteNumberTable.position.y = paletteColorTable.position.y - cellSize * 0.9;
  paletteNumberTable.position.z = paletteColorTable.position.z;
  scene.add(paletteNumberTable);

  camera.position.z = 1500;
  camera.position.x = tableCenter.x;
  camera.position.y = tableCenter.y;

  let renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio * 3)
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

  const paletteDests = paletteValues[0].map(() => []);
  numbers.forEach((row, i) => {
    row.forEach((x, j) => {
      const paletteIdx = paletteValues[0].reduce((acc, currVal, currIdx, arr) => {
	return Math.abs(currVal - x) < Math.abs(arr[acc] - x) ? currIdx : acc;
      }, 0);
      paletteDests[paletteIdx].push([i, j]);
    });
  });
  const tl = gsap.timeline({
    delay: 2,
    paused: true,
    onUpdate: render,
    defaults: {
      ease: "power2.inOut" 
    },
  });
  paletteDests.forEach((dests, paletteIdx) => {
    const srcMesh = paletteColorMeshes[0][paletteIdx];
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
      tl.to(dstMesh.scale, {
	x: 1.5,
	y: 1.5,
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
})
</script>

<template>
<div ref="containerRef"></div>
</template>

<style>
  @font-face {
    font-family: "Quicksand";
    font-weight: 400;
    font-style: normal;
    font-display: auto;
    unicode-range: U+000-5FF;
    src: local("Quicksand"), url("/fonts/Quicksand/Quicksand-Regular.ttf") format("truetype");
  }
</style>
