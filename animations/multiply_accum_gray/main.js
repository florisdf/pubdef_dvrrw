import {
    getObjectCenter, getObjectSize,
    idxToNumber,
} from '../image_palette/image_palette.js';
import ghostIdxs from './ghost_gray.js';
import pacmanIdxs from './pacman_gray.js';

import { getSquareTextMesh, getColoredNumberTable, getColorTable } from './pixel_tables.js';
import { OperandBox } from './operand_box.js';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const KUL_RGB = '0,64,122'


function elWiseProduct(inputNumbers, weightNumbers) {
    return inputNumbers.map((row, i) => row.map((number, j) => number * weightNumbers[i][j]));
}


function getAnimationTimeline({
    inputGroup, inputMeshes,
    inputColorGroup, inputColorMeshes,
    weightGroup, weightMeshes,
    productGroup, productMeshes,
    macMesh,
}) {
    // Put in initial positions
    const tableSize = getObjectSize(inputGroup);
    const shiftX = 1000;
    const shiftY = tableSize.y + 500;

    const cellSize = getObjectSize(inputMeshes[0][0]);

    inputColorGroup.position.x -= shiftX;
    inputGroup.position.x -= shiftX;

    productGroup.position.x += shiftX;

    macMesh.position.x += 1.5*shiftX;
    macMesh.position.y -= tableSize.y/2;
    macMesh.position.z -= tableSize.x/2;

    inputColorGroup.rotation.y = Math.PI/2;
    inputGroup.rotation.y = Math.PI/2;
    weightGroup.rotation.y = Math.PI/2;
    productGroup.rotation.y = Math.PI/2;
    macMesh.rotation.y = Math.PI/2;

    productMeshes.flat().forEach(m => {
        m.material.depthWrite = false;
    });

    const opBoxProd = new OperandBox({
        color: 'darkblue',
        opacity: 0.1,
        width: shiftX,
        heightStart: cellSize.y,
        heightEnd: cellSize.y,
        opChar: "×",
        opSize: cellSize.y,
    });
    opBoxProd.group.position.x -= shiftX;
    opBoxProd.group.position.y -= cellSize.y/2;
    opBoxProd.group.position.z -= cellSize.x/2;

    const opBoxEq = new OperandBox({
        color: 'darkblue',
        opacity: 0.1,
        width: shiftX,
        heightStart: cellSize.y,
        heightEnd: cellSize.y,
        opChar: "=",
        opSize: cellSize.y,
    });
    opBoxEq.group.position.y -= cellSize.y/2;
    opBoxEq.group.position.z -= cellSize.x/2;

    const opBoxSum = new OperandBox({
        color: 'darkgreen',
        opacity: 0.05,
        width: shiftX/2,
        heightStart: tableSize.y,
        heightEnd: cellSize.y,
        opChar: "+",
        opSize: (tableSize.y + cellSize.y)/2,
    });
    opBoxSum.group.position.x += shiftX;
    opBoxSum.group.position.y -= tableSize.y/2;
    opBoxSum.group.position.z -= tableSize.x/2;

    const opBoxActiv = new OperandBox({
        color: 'darkred',
        opacity: 0.1,
        width: shiftX,
        heightStart: cellSize.y,
        heightEnd: cellSize.y,
        opChar: ">",
        opSize: cellSize.y,
    });
    opBoxActiv.group.position.x += 2*shiftX;
    opBoxActiv.group.position.y -= tableSize.y/2;
    opBoxActiv.group.position.z -= tableSize.x/2;

    // Create scene
    const sceneGroup = new THREE.Group();
    sceneGroup.add(inputGroup);
    sceneGroup.add(inputColorGroup);

    sceneGroup.add(weightGroup);

    sceneGroup.add(productGroup);

    sceneGroup.add(opBoxProd.group);
    sceneGroup.add(opBoxEq.group);

    sceneGroup.add(opBoxSum.group);
    sceneGroup.add(macMesh);

    // sceneGroup.add(opBoxActiv.group);

    const scene = new THREE.Scene();
    scene.add(sceneGroup);

    // Create camera
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    const sceneCenter = getObjectCenter(sceneGroup);
    // camera.position.x = sceneCenter.x;
    // camera.position.y = sceneCenter.y;
    // camera.position.z += 3500;

    camera.position.x = 2500
    camera.position.y = weightGroup.position.y - tableSize.y / 2;
    camera.position.z = 1250

    camera.rotation.x = 0
    camera.rotation.y = Math.PI/4
    camera.rotation.z = 0

    // Render
    const container = document.getElementById('container');
    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio)
    const renderEl = renderer.domElement;
    container.appendChild(renderEl);
    renderer.setSize(canvasWidth, canvasHeight);

    // const controls = new OrbitControls(camera, renderEl);
    // controls.update()

    function render() {
        [opBoxProd, opBoxEq, opBoxSum].forEach(b => b.operand.lookAt(camera.position))
        // controls.update()
        renderer.render(scene, camera); 
    }

    function animateControl() {
        render();
        requestAnimationFrame(animateControl);
    }

    // Animate
    const tl = gsap.timeline({
        delay: 2,
        onUpdate: render,
        // onComplete: animateControl,
        defaults: {
            ease: "power2.inOut" 
        },
    });

    tl.from(inputMeshes.flat().map(m => m.material), {
        opacity: 0,
        delay: 2,
    }).to(inputColorMeshes.flat().map(m => m.material), {
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

    tl.from(weightMeshes.flat().map(m => m.material), {
        opacity: 0,
        delay: 2,
    }).from(weightGroup.position, {
        y: "-=100",
    }, '<')

    tl.from(opBoxProd, {width: 0, duration: 2, delay: 2})
        .from(opBoxProd, {opSize: 0, duration: 2}, '<')
        .from(opBoxEq, {width: 0, duration: 2})
        .from(opBoxEq, {opSize: 0, duration: 2}, '<');
    const opBoxPositions = [opBoxProd.group.position, opBoxEq.group.position];
    productMeshes.forEach((row, i, arr) => {
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
    });
    tl.to([opBoxProd, opBoxEq], {width: 0});

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
    return tl;
}

function getGhostSceneComps(inputNumbers, weightNumbers) {
    const cellSize = 100;
    const strokeWidth = cellSize / 100;

    const fillOpacity = 0.05;
    const numberToColor = x => {
        x = Math.round(x * 30 + 70);
        return `hsl(0, 0%, ${x}%)`;
    };

    const {group: inputGroup, meshes: inputMeshes} = getColoredNumberTable({
        numbers: inputNumbers,
        numberToColor,
        cellSize,
        strokeWidth,
    });
    const {group: inputColorGroup, meshes: inputColorMeshes} = getColorTable({
        colors: inputNumbers.map(row => row.map(x => {
            x = Math.round(x*255);
            return `rgb(${x}, ${x}, ${x})`;
        })),
        cellSize,
    });

    const {group: weightGroup, meshes: weightMeshes} = getColoredNumberTable({
        numbers: weightNumbers,
        numberToColor,
        cellSize,
        strokeWidth,
    });

    const productNumbers = elWiseProduct(inputNumbers, weightNumbers);
    const {group: productGroup, meshes: productMeshes} = getColoredNumberTable({
        numbers: productNumbers,
        numberToColor: x => {
            x = Math.round(x * 30 + 70);
            return `hsl(240, 50%, ${x}%)`;
        },
        cellSize,
        strokeWidth,
    });

    const macResult = (productNumbers.flat().reduce((acc, curr) => acc + curr, 0)).toFixed(1);
    const macMesh = getSquareTextMesh({text: macResult, size: cellSize, fillColor: 'white'});

    return {
        inputGroup, inputMeshes,
        inputColorGroup, inputColorMeshes,
        weightGroup, weightMeshes,
        productGroup, productMeshes,
        macMesh,
    };
}


function main() {
    const maxValue = 100;
    const palette = _.range(0, maxValue + 1).map(x => x/maxValue);
    const inputNumbers = idxToNumber(ghostIdxs, palette);
    const weightNumbers = idxToNumber(ghostIdxs, palette);

    const tl = getAnimationTimeline(getGhostSceneComps(inputNumbers, weightNumbers));
    tl.play();
}

window.addEventListener('load', function () {
    main();
})
