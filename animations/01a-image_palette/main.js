import {
    getObjectCenter, getObjectSize,
    floatToGray, getNumberTableWithPalette, animatePaletteToTable
} from './image_palette.js';
import waldek from './waldek_the_gray.js';
import GSDevTools from '../lib/gsap-shockingly-green/GSDevTools.js';
import * as THREE from 'three';

import capture from '../lib/capture.js';


function getAnimationTimeline(sceneComps) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    const {sceneGroup, numberTableGroup, paletteGroup} = sceneComps;
    scene.add(sceneGroup);

    const canvasWidth = 1920;
    const canvasHeight = 1080;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    const tableCenter = getObjectCenter(numberTableGroup);

    camera.position.z = tableCenter.z + 6250;
    camera.position.x = tableCenter.x;
    camera.position.y = tableCenter.y;

    const container = document.getElementById('container');
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(1);
    const renderEl = renderer.domElement;
    container.appendChild(renderEl);
    renderer.setSize(canvasWidth, canvasHeight);

    function render() {
        renderer.render(scene, camera);
    }

    const tl = gsap.timeline({
        onUpdate: render,
        paused: true,
        defaults: {
            ease: "power2.inOut" 
        },
    });

    tl.add(() => {}, "+=1")

    const paletteGroupCenter = getObjectCenter(paletteGroup);
    tl.to(camera.position, {
        z: paletteGroupCenter.z + 4000,
        x: paletteGroupCenter.x,
        y: paletteGroupCenter.y,
        duration: 2,
    })

    const sceneCenter = getObjectCenter(sceneGroup);
    tl.to(camera.position, {
        z: "+=5000",
        x: sceneCenter.x,
        y: sceneCenter.y,
        duration: 2,
    }, "+=2")
    const {tl: tlSub} = animatePaletteToTable({
        scene: scene,
        ...sceneComps,
        simultaneous: false
    });
    tl.add(tlSub);
    tl.add(() => {}, "+=1")

    return {tl, canvas: renderEl};
}



function main() {
    const stepSize = 15;
    const maxValue = 100;
    const paletteTable = _.range(0, maxValue + 1, stepSize).map(x => _.range(x, Math.min(x + stepSize, maxValue + 1)).map(x => x/maxValue));

    const sceneComps = getNumberTableWithPalette(waldek, paletteTable, floatToGray)

    const {tl, canvas} = getAnimationTimeline(sceneComps);

    // tl.play()
    const name = window.location.pathname.split('/').slice(-2)[0];
    capture({tl, canvas, name});
    // GSDevTools.create({animation: tl});
}

window.addEventListener('load', function () {
    main();
})
