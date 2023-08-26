import {
    getObjectCenter, getObjectSize,
    floatToRed, floatToGreen, floatToBlue,
    getNumberTable, getColorTable, idxToNumber
} from '../image_palette/image_palette.js';
import * as THREE from '../lib/three.module.js';
import cyanGhostRed from './cyan_ghost_red.js';
import cyanGhostGreen from './cyan_ghost_green.js';
import cyanGhostBlue from './cyan_ghost_blue.js';


function getAnimationTimeline({
    redColorGroup, redColorMeshes,
    redNumberGroup, redNumberMeshes,
    greenColorGroup, greenColorMeshes,
    greenNumberGroup, greenNumberMeshes,
    blueColorGroup, blueColorMeshes,
    blueNumberGroup, blueNumberMeshes,
    redWeightGroup, redWeightMeshes,
    greenWeightGroup, greenWeightMeshes,
    blueWeightGroup, blueWeightMeshes,
}) {
    // Put in initial positions
    const tableSize = getObjectSize(redColorGroup);
    const shiftX = tableSize.x + 100
    const shiftY = tableSize.y + 100

    redWeightGroup.position.x -= shiftX;
    blueWeightGroup.position.x += shiftX;

    redWeightGroup.position.y -= shiftY;
    greenWeightGroup.position.y -= shiftY;
    blueWeightGroup.position.y -= shiftY;

    // Create scene
    const sceneGroup = new THREE.Group();
    sceneGroup.add(redNumberGroup);
    sceneGroup.add(greenNumberGroup);
    sceneGroup.add(blueNumberGroup);

    sceneGroup.add(redColorGroup);
    sceneGroup.add(greenColorGroup);
    sceneGroup.add(blueColorGroup);

    sceneGroup.add(redWeightGroup);
    sceneGroup.add(greenWeightGroup);
    sceneGroup.add(blueWeightGroup);

    const scene = new THREE.Scene();
    scene.add(sceneGroup);

    // Create camera
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    const sceneCenter = getObjectCenter(sceneGroup);
    camera.position.x = sceneCenter.x;
    camera.position.y = sceneCenter.y;
    camera.position.z += 3500;

    // Render
    const container = document.getElementById('container');
    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio)
    const renderEl = renderer.domElement;
    container.appendChild(renderEl);
    renderer.setSize(canvasWidth, canvasHeight);

    function render() {
        renderer.render(scene, camera);
    }

    // Animate
    const tl = gsap.timeline({
        delay: 0.5,
        onUpdate: render,
        defaults: {
            ease: "power2.inOut" 
        },
    });

    const allMeshes = [redColorMeshes, greenColorMeshes, blueColorMeshes].flat().flat();
    const materials = allMeshes.map(mesh => mesh.material);

    tl.to(
        [redColorGroup.position, redNumberGroup.position], {
            x: `-=${shiftX}`
        },
        'chShift'
    ).to(
        [blueColorGroup.position, blueNumberGroup.position], {
            x: `+=${shiftX}`
        },
        'chShift'
    ).to(materials, {
        opacity: 0
    }).from(
        [redWeightGroup.position, greenWeightGroup.position, blueWeightGroup.position], {
            y: `-=${5*shiftY}`,
        }
    );

    return tl;
}


function getCyanGhostSceneComps() {
    const maxValue = 100;
    const palette = _.range(0, maxValue + 1).map(x => x/maxValue);

    const cellSize = 100;
    const {group: redColorGroup, meshes: redColorMeshes} = getColorTable(floatToRed(cyanGhostRed), cellSize);
    const {group: greenColorGroup, meshes: greenColorMeshes} = getColorTable(floatToGreen(cyanGhostGreen), cellSize);
    const {group: blueColorGroup, meshes: blueColorMeshes} = getColorTable(floatToBlue(cyanGhostBlue), cellSize);

    redColorGroup.position.z += 10;
    greenColorGroup.position.z += 10;
    blueColorGroup.position.z += 10;

    [redColorMeshes, greenColorMeshes, blueColorMeshes].forEach(meshes => {
        meshes.flat().forEach(mesh => {
            mesh.material.blending = THREE.AdditiveBlending;
            mesh.material.transparent = true;
        });
    });

    const strokeWidth = cellSize / 100;
    const {group: redNumberGroup, meshes: redNumberMeshes} = getNumberTable(idxToNumber(cyanGhostRed, palette), cellSize, strokeWidth);
    const {group: greenNumberGroup, meshes: greenNumberMeshes} = getNumberTable(idxToNumber(cyanGhostGreen, palette), cellSize, strokeWidth);
    const {group: blueNumberGroup, meshes: blueNumberMeshes} = getNumberTable(idxToNumber(cyanGhostBlue, palette), cellSize, strokeWidth);

    const weightColor = "#f58800";
    const {group: redWeightGroup, meshes: redWeightMeshes} = getNumberTable(idxToNumber(cyanGhostRed, palette), cellSize, strokeWidth, 0, 0, 2, weightColor);
    const {group: greenWeightGroup, meshes: greenWeightMeshes} = getNumberTable(idxToNumber(cyanGhostGreen, palette), cellSize, strokeWidth, 0, 0, 2, weightColor);
    const {group: blueWeightGroup, meshes: blueWeightMeshes} = getNumberTable(idxToNumber(cyanGhostBlue, palette), cellSize, strokeWidth, 0, 0, 2, weightColor);

    return {
        redColorGroup, redColorMeshes,
        redNumberGroup, redNumberMeshes,
        greenColorGroup, greenColorMeshes,
        greenNumberGroup, greenNumberMeshes,
        blueColorGroup, blueColorMeshes,
        blueNumberGroup, blueNumberMeshes,
        redWeightGroup, redWeightMeshes,
        greenWeightGroup, greenWeightMeshes,
        blueWeightGroup, blueWeightMeshes,
    };
}


function main() {
    const tl = getAnimationTimeline(getCyanGhostSceneComps());
    tl.play();
}

window.addEventListener('load', function () {
    main();
})
