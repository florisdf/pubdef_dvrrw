<script setup lang="ts">
import { shallowRef, onMounted } from 'vue';

import * as THREE from 'three';
import TWEEN from 'three/addons/libs/tween.module.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

const containerRef = shallowRef();

onMounted(() => {
  const container = containerRef.value;

  const width = 300;
  const height = 300;

  let camera = new THREE.PerspectiveCamera(45, width/height, 1, 1000);
  camera.position.z = 100;

  let scene = new THREE.Scene();

  const canvas = document.createElement("canvas");
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d");
  ctx.font = '20pt Arial'
  ctx.fillStyle = 'blue'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'black'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Test', canvas.width / 2, canvas.height / 2)
  container.appendChild(canvas);
  return

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true

  var material = new THREE.MeshBasicMaterial({
     map: texture,
  })
  material.transparent = true
  var mesh = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), material)

  scene.add(mesh);

  let renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement);
  renderer.setSize(width, height);

  renderer.render(scene, camera);
})
</script>

<template>
<div ref="containerRef"></div>
</template>
