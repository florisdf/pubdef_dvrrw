import {
    getObjectCenter, getObjectSize,
    floatToRed, floatToGreen, floatToBlue,
    getNumberTableWithPalette, animatePaletteToTable
} from '../image_palette/image_palette.js';
import * as THREE from '../lib/three.module.js';
import waldek_red from './waldek_the_red.js';
import waldek_green from './waldek_the_green.js';
import waldek_blue from './waldek_the_blue.js';


function getAnimationTimeline(sceneCompsRed, sceneCompsGreen, sceneCompsBlue) {
    const scene = new THREE.Scene();

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

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    const sceneCenterRed = getObjectCenter(sceneGroupRed);

    camera.position.z = sceneCenterRed.z + 9000;
    camera.position.x = sceneCenterRed.x;
    camera.position.y = sceneCenterRed.y;

    const container = document.getElementById('container');

    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio)
    const renderEl = renderer.domElement;
    container.appendChild(renderEl);
    renderer.setSize(canvasWidth, canvasHeight);
    function render() {
        renderer.render(scene, camera);
    }
    render()

    const tl = gsap.timeline({
        delay: 0.5,
        paused: true,
        onUpdate: render,
        defaults: {
            ease: "power2.inOut" 
        },
    });

    const allSceneComps = [sceneCompsRed, sceneCompsGreen, sceneCompsBlue];
    const meshCloneGroups = [];
    allSceneComps.forEach((sceneComps, i, arr) =>  {
        const {tl: tlSub, meshCloneGroup} = animatePaletteToTable({
            scene: scene,
            ...sceneComps
        });
        if (i < arr.length - 1) {
            tlSub.to(camera.position, {
                y: `-=${sceneShiftY}`,
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
        onStart: () => {
            allSceneComps.forEach(({numberTableGroup, paletteColorMeshes}, i) =>  {
                numberTableGroup.removeFromParent();
                paletteColorMeshes.flat().forEach(mesh => {
                    mesh.material.blending = THREE.AdditiveBlending;
                });
            });
        },
    })

    tl.to(
        meshCloneGroups[0].position, {
            y: `-=${sceneShiftY}`,
            duration: 2,
        }, 'meshOverlap'
    ).to(
        meshCloneGroups[2].position, {
            y: `+=${sceneShiftY}`,
            duration: 2,
        }, 'meshOverlap'
    )

    return tl;
}


function main() {
    const stepSize = 15;
    const maxValue = 100;
    const paletteTable = _.range(0, maxValue + 1, stepSize).map(x => _.range(x, Math.min(x + stepSize, maxValue + 1)).map(x => x/maxValue));

    const sceneCompsRed = getNumberTableWithPalette(waldek_red, paletteTable, floatToRed)
    const sceneCompsGreen = getNumberTableWithPalette(waldek_green, paletteTable, floatToGreen)
    const sceneCompsBlue = getNumberTableWithPalette(waldek_blue, paletteTable, floatToBlue)

    const tl = getAnimationTimeline(sceneCompsRed, sceneCompsGreen, sceneCompsBlue);
    tl.play();
}

window.addEventListener('load', function () {
    main();
})
