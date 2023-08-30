import { idxToNumber, } from '../image_palette/image_palette.js';
import ghostIdxsRed from './cyan_ghost_red.js';
import ghostIdxsGreen from './cyan_ghost_green.js';
import ghostIdxsBlue from './cyan_ghost_blue.js';
import populatedMaze from './populated_maze.js';

import { PixelTable } from '../multiply_accum_gray/pixel_tables.js';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


function main() {
    const maxValue = 100;
    const palette = _.range(0, maxValue + 1).map(x => x/maxValue);

    const ghostNumbersRed = idxToNumber(ghostIdxsRed, palette);
    const ghostNumbersGreen = idxToNumber(ghostIdxsGreen, palette);
    const ghostNumbersBlue = idxToNumber(ghostIdxsBlue, palette);
    const ghostNumbersRGB = [ghostNumbersRed, ghostNumbersGreen, ghostNumbersBlue];

    const mazeRGB = populatedMaze.map(c => idxToNumber(c, palette));

    const table = PixelTable({
        values: mazeRGB,
        valueToColor: (x, channel) => {
            x = Math.round(x * 255);
            const rgb = [0, 0, 0];
            rgb[channel] = x;
            return `rgb(${rgb.join(',')})`;
        },
        cellSize: 100,
        strokeWidth: 0,
    });

    const scene = new THREE.Scene();
    scene.add(table.group);

    // Create camera
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    camera.position.x = tableSize/2;
    camera.position.y = 3000;
    camera.position.z = productGroup.position.z + 3000;

    camera.lookAt(new THREE.Vector3(tableSize/2, -tableSize/2, productGroup.position.z));

    // Render
    const container = document.getElementById('container');
    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio)
    const renderEl = renderer.domElement;
    container.appendChild(renderEl);
    renderer.setSize(canvasWidth, canvasHeight);

    const controls = new OrbitControls(camera, renderEl);

    function render() {
        renderer.render(scene, camera); 
    }

    function animateControl() {
        render();
        controls.update()
        requestAnimationFrame(animateControl);
    }

    // Animate
    const tl = gsap.timeline({
        delay: 2,
        onUpdate: render,
        onComplete: animateControl,
        defaults: {
            ease: "power2.inOut" 
        },
    });

    const tl = getAnimationTimeline(getGhostSceneComps(inputNumbers, weightNumbers));
    tl.play();
}

window.addEventListener('load', function () {
    main();
})
