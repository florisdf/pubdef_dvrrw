import {
    getObjectCenter, getObjectSize,
    floatToRed, floatToGreen, floatToBlue,
    getNumberTableWithPalette, animatePaletteToTable
} from '../image_palette/image_palette.js';
import * as THREE from 'three';
import waldek_red from './waldek_the_red.js';
import waldek_green from './waldek_the_green.js';
import waldek_blue from './waldek_the_blue.js';
import GSDevTools from '../lib/gsap-shockingly-green/GSDevTools.js';

import capture from '../lib/capture.js';


function getAnimationTimeline(sceneCompsRed, sceneCompsGreen, sceneCompsBlue) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    const {sceneGroup: sceneGroupRed} = sceneCompsRed;
    const {sceneGroup: sceneGroupGreen} = sceneCompsGreen;
    const {sceneGroup: sceneGroupBlue} = sceneCompsBlue;

    const sceneRedSize = getObjectSize(sceneGroupRed);

    const sceneMargin = sceneRedSize.y / 4;
    const sceneShiftY = sceneRedSize.y + sceneMargin;
    sceneGroupGreen.position.y -= sceneShiftY;
    sceneGroupBlue.position.y -= 2*sceneShiftY

    scene.add(sceneGroupRed);
    scene.add(sceneGroupGreen);
    scene.add(sceneGroupBlue);

    const canvasWidth = 1920;
    const canvasHeight = 1080;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    const sceneCenterRed = getObjectCenter(sceneGroupRed);

    camera.position.z = sceneCenterRed.z + 9000;
    camera.position.x = sceneCenterRed.x;
    camera.position.y = sceneCenterRed.y;

    const container = document.getElementById('container');

    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(1)
    const canvas = renderer.domElement;
    container.appendChild(canvas);
    renderer.setSize(canvasWidth, canvasHeight);
    function render() {
        renderer.render(scene, camera);
    }
    renderer.setClearColor(0xffffff, 0);
    render()

    const tl = gsap.timeline({
        paused: true,
        onUpdate: render,
        defaults: {
            ease: "power2.inOut" 
        },
    });

    tl.add(() => {}, "+=1")

    let duration = 2;
    let delay = 2;
    const allSceneComps = [sceneCompsRed, sceneCompsGreen, sceneCompsBlue];
    const meshCloneGroups = [];
    allSceneComps.forEach((sceneComps, i, arr) =>  {
        const {tl: tlSub, meshCloneGroup} = animatePaletteToTable({
            scene: scene,
            pixelFlyDuration: duration,
            ...sceneComps
        });
        if (i < arr.length - 1) {
            tlSub.to(camera.position, {
                y: `-=${sceneShiftY}`,
                duration,
                delay,
            })
        }
        meshCloneGroups.push(meshCloneGroup);
        tl.add(tlSub);
    });

    const sceneCenterGreen = getObjectCenter(sceneGroupGreen);

    tl.to(camera.position, {
        x: sceneCenterGreen.x,
        y: sceneCenterGreen.y,
        z: "+=13000",
        duration,
        onStart: () => {
            allSceneComps.forEach(({numberTableGroup, paletteColorMeshes}, i) =>  {
                const blackMaterial = new THREE.MeshBasicMaterial({
                    color: 0x000000
                });
                numberTableGroup.children.forEach(mesh => {
                    mesh.position.z -= 10;
                    mesh.material = blackMaterial;
                    mesh.renderOrder = 0;
                });
                meshCloneGroups[i].children.forEach(mesh => {
                    mesh.material = mesh.material.clone();
                    mesh.material.blending = THREE.AdditiveBlending;
                    mesh.material.depthWrite = false;
                    mesh.material.transparent = true;
                    mesh.renderOrder = 10;
                });
            });
        },
    })

    duration = 3;
    delay = 3;
    tl.to(
        [meshCloneGroups[0].position, allSceneComps[0].numberTableGroup.position], {
            y: `-=${sceneShiftY}`,
            duration,
            delay,
        }, 'meshOverlap'
    ).to(
        [meshCloneGroups[2].position, allSceneComps[2].numberTableGroup.position], {
            y: `+=${sceneShiftY}`,
            duration,
            delay,
        }, 'meshOverlap'
    )
    tl.add(() => {}, "+=1")

    return {tl, canvas};
}


function main() {
    const stepSize = 15;
    const maxValue = 100;
    const paletteTable = _.range(0, maxValue + 1, stepSize).map(x => _.range(x, Math.min(x + stepSize, maxValue + 1)).map(x => x/maxValue));

    const sceneCompsRed = getNumberTableWithPalette(waldek_red, paletteTable, floatToRed)
    const sceneCompsGreen = getNumberTableWithPalette(waldek_green, paletteTable, floatToGreen)
    const sceneCompsBlue = getNumberTableWithPalette(waldek_blue, paletteTable, floatToBlue)

    const {tl, canvas} = getAnimationTimeline(sceneCompsRed, sceneCompsGreen, sceneCompsBlue);
    capture({tl, canvas});
    // tl.play();
    // GSDevTools.create({animation: tl});
}

window.addEventListener('load', function () {
    main();
})
