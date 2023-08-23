<script setup lang="ts">
import { shallowRef, onMounted } from 'vue';

import * as THREE from 'three';
import TWEEN from 'three/addons/libs/tween.module.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const containerRef = shallowRef();


function getSquareTextMesh(text, size, fontSize='20pt', borderWidth=3, fontFamily='Quicksand') {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Set actual size in memory (scaled to account for extra pixel density).
  const scale = window.devicePixelRatio; // Change to 1 on retina screens to see blurry canvas.
  canvas.width = Math.floor(size * scale);
  canvas.height = Math.floor(size * scale);

  // Normalize coordinate system to use CSS pixels.
  ctx.scale(scale, scale);

  ctx.font = `${fontSize} ${fontFamily}`;
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, size / 2, size / 2)
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(0, 0, size, size)

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
  cells, cellToMesh, cellSize
) {
  const numRows = cells.length;
  const numCols = Math.min(...cells.map(row => row.length));

  const group = new THREE.Group();

  let i, j;
  for (i = 0; i < numRows; i++) {
    for (j = 0; j < numCols; j++) {
      const cell = cells[i][j];
      const mesh = cellToMesh(cell, cellSize);
      mesh.position.x = i*cellSize + cellSize/2;
      mesh.position.y = - j*cellSize - cellSize/2;
      mesh.position.z = 0;
      group.add(mesh);
    }
  }
  return group;
}


function getNumberTable(
  numbers, cellSize, lineWidth,
  fontSize=`${cellSize*.4}px`,
  precision=2
) {
  return getTable(
    numbers,
    (cell, cellSize) => {
      const x = cell.toFixed(precision)
      return getSquareTextMesh(`${x}`, cellSize, fontSize, lineWidth);
    },
    cellSize
  );
}


function getColorSquare(
  color, size
) {
  var material = new THREE.MeshBasicMaterial({
    color: color,
    side: THREE.DoubleSide,
  })
  var mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material)
  return mesh
}


function getColorTable(
  colors, cellSize,
) {
  return getTable(
    colors,
    getColorSquare,
    cellSize
  );
}


onMounted(() => {
  const container = containerRef.value;

  const canvasWidth = 300;
  const canvasHeight = 300;

  const cellSize = 100;
  const lineWidth = 3;
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
  camera.position.z = 2000;
  camera.position.x = tableWidth / 2;
  camera.position.y = - tableHeight / 2;

  let scene = new THREE.Scene();

  const numberTable = getNumberTable(
    numbers, cellSize, lineWidth,
  )
  scene.add(numberTable);

  const colors = numbers.map(row => row.map(x => {
    return new THREE.Color(x, x, x);
  }));
  const colorTable = getColorTable(
    colors, cellSize,
  )
  colorTable.position.x += tableWidth;
  scene.add(colorTable);

  let renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio * 3)
  container.appendChild(renderer.domElement);
  renderer.domElement.style.margin = "auto"
  renderer.setSize(canvasWidth, canvasHeight);

  renderer.render(scene, camera);
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
