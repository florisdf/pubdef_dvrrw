import {
    idxToNumber,
} from '../image_palette/image_palette.js';
import ghostIdxsGray from './ghost_gray.js';
import ghostIdxsRed from './cyan_ghost_red.js';
import ghostIdxsGreen from './cyan_ghost_green.js';
import ghostIdxsBlue from './cyan_ghost_blue.js';
import pacmanIdxsGray from './pacman_gray.js';

import { Neuron } from './neuron.js';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


function getAnimationTimeline({
    neuron, scene
}) {
    const inputGroup = neuron.group.getObjectByName('input');
    const productGroup = neuron.group.getObjectByName('productResult');
    const tableSize = new THREE.Box3().setFromObject(inputGroup).getSize(new THREE.Vector3());
    const cellSize = new THREE.Box3().setFromObject(inputGroup.children[0].children[0]).getSize(new THREE.Vector3());

    [...neuron.productBoxes, ...neuron.equalsBoxes].forEach(box => {
        box.startWidth = cellSize.x;
        box.startHeight = cellSize.x;
        box.endWidth = cellSize.x;
        box.endHeight = cellSize.x;
        console.log(box)
    });

    // Create camera
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    camera.position.x = tableSize.x/2;
    camera.position.y = 3000;
    camera.position.z = productGroup.position.z + 3000;

    camera.lookAt(new THREE.Vector3(tableSize.x/2, -tableSize.y/2, productGroup.position.z));

    // Render
    const container = document.getElementById('container');
    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio)
    const renderEl = renderer.domElement;
    container.appendChild(renderEl);
    renderer.setSize(canvasWidth, canvasHeight);

    const controls = new OrbitControls(camera, renderEl);

    function render() {
        const productBoxes = _.range(neuron.numChannels).map(
            i => neuron.group.getObjectByName(`productBox${i}`)
        )
        const eqBoxes = _.range(neuron.numChannels).map(
            i => neuron.group.getObjectByName(`eqBox${i}`)
        )
        const sumBox = neuron.group.getObjectByName('sumBox');
        const actBox = neuron.group.getObjectByName('activationBox');
        [...productBoxes, ...eqBoxes, sumBox, actBox].forEach(
            b => b.getObjectByName('operand').lookAt(camera.position)
        )
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

    /**
    tl.from(inputMeshes.flat().flat().map(m => m.material), {
        opacity: 0,
    }).to(inputColorMeshes.flat().flat().map(m => m.material), {
        opacity: 0,
        delay: 2,
    }, '<')

    tl.from(camera.position, {
        x: inputColorGroup.position.x + 2000,
        y: inputColorGroup.position.y - tableSize.y / 2,
        z: inputColorGroup.position.z - tableSize.x / 2,
        duration: 2,
        delay: 2,
    }).from(camera.rotation, {
        y: Math.PI / 2,
        duration: 2
    }, '<')

    tl.from(weightMeshes.flat().flat().map(m => m.material), {
        opacity: 0,
        delay: 2,
    }).from(weightGroup.position, {
        y: "-=100",
    }, '<')

    tl.from(opBoxTimes, {width: 0, duration: 2, delay: 2})
        .from(opBoxTimes, {opSize: 0, duration: 2}, '<')
        .from(opBoxEq, {width: 0, duration: 2})
        .from(opBoxEq, {opSize: 0, duration: 2}, '<');
    const opBoxPositions = [opBoxTimes.group.position, opBoxEq.group.position];
    productMeshes.forEach(
        (channel, c) => channel.forEach((row, i, arr) => {
            const duration = 0.05;
            row.forEach((mesh, j) => {
                const dur = (i !== 0 || j > 5) ? duration : duration * 10;
                if (j !== 0) {
                    tl.to(opBoxPositions, {z: `-=${cellSize.x}`, duration: dur})
                }
                tl.from(mesh.material, {opacity: 0, duration: dur});
            });
            if (i < arr.length - 1) {
                tl.to(opBoxPositions, {y: `-=${cellSize.y}`, z: `+=${(row.length - 1)*cellSize.x}`, duration: duration});
            }
            tl.to(opBoxPositions, {y: `-=${tableSize.y}`, z: `+=${shiftX}`});
        })
    );
    tl.to([opBoxTimes, opBoxEq], {width: 0});

    tl.from(opBoxSum, {heightEnd: opBoxSum.heightStart, width: 0, duration: 2}, '<')
        .from(opBoxSum, {opSize: 0, duration: 2}, '<')
        .from(macMesh.material, {
            opacity: 0,
        }).to(camera.rotation, {
            y: Math.PI/2,
            yoyo: true,
            repeat: 1,
            repeatDelay: 3,
        }).to(camera.position, {
            x: macMesh.position.x + 400,
            z: macMesh.position.z,
            yoyo: true,
            repeat: 1,
            repeatDelay: 3,
        }, '<');
    */
    return tl;
}


function getNumDims(arr) {
    if (Array.isArray(arr)) {
        return 1 + getNumDims(arr[0]);
    } else {
        return 0;
    }
}

function getGhostSceneComps(input, weights) {
    // Create scene
    const scene = new THREE.Scene();

    const neuron = new Neuron({input, weights, bias: 50});
    scene.add(neuron.group);

    const gridHelper = new THREE.GridHelper(1000, 10);
    const axesHelper = new THREE.AxesHelper(2000);
    scene.add(gridHelper);
    scene.add(axesHelper);

    return { neuron, scene };
}


function main() {
    const maxValue = 100;
    const palette = _.range(0, maxValue + 1).map(x => x/maxValue);
    const ghostNumbersGray = idxToNumber(ghostIdxsGray, palette);
    const pacmanNumbersGray = idxToNumber(pacmanIdxsGray, palette);

    const ghostNumbersRed = idxToNumber(ghostIdxsRed, palette);
    const ghostNumbersGreen = idxToNumber(ghostIdxsGreen, palette);
    const ghostNumbersBlue = idxToNumber(ghostIdxsBlue, palette);
    const ghostNumbersRGB = [ghostNumbersRed, ghostNumbersGreen, ghostNumbersBlue];

    const inputNumbers = [ghostNumbersGray];
    const weightNumbers = [ghostNumbersGray];
    // const inputNumbers = ghostNumbersRGB;
    // const weightNumbers = ghostNumbersRGB;

    const tl = getAnimationTimeline(getGhostSceneComps(inputNumbers, weightNumbers));
    tl.play();
}

window.addEventListener('load', function () {
    main();
})
