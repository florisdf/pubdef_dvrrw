import {
    getObjectCenter, getObjectSize,
    idxToNumber,
} from '../image_palette/image_palette.js';
import ghostIdxsGray from './ghost_gray.js';
import ghostIdxsRed from './cyan_ghost_red.js';
import ghostIdxsGreen from './cyan_ghost_green.js';
import ghostIdxsBlue from './cyan_ghost_blue.js';
import pacmanIdxsGray from './pacman_gray.js';

import {
    getSquareTextMesh, getColoredNumberTable, getColorTable,
    getMultiChannelColoredNumberTable
} from './pixel_tables.js';
import { OperandBox } from './operand_box.js';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const KUL_RGB = '0,64,122'


function elWiseProduct(inputNumbers, weightNumbers) {
    return inputNumbers.map((row, i) => row.map((number, j) => number * weightNumbers[i][j]));
}


function getAnimationTimeline({
    inputGroup,
    inputColorGroup,
    weightGroup,
    productGroup,
    opBoxTimes, opBoxEq, opBoxSum,
    macMesh, opShift
}) {
    // Put in initial positions
    const tableSize = getObjectSize(inputGroup);
    const cellSize = getObjectSize(inputGroup.children[0].children[0]);

    const midChannel = Math.floor(inputGroup.children.length / 2);
    inputColorGroup.position.x = inputGroup.children[midChannel].position.x

    weightGroup.position.z = opShift;

    productGroup.position.z = 2*opShift;

    opBoxTimes.forEach((box, i) => {
        box.group.position.x = inputGroup.children[i].position.x;
    });
    opBoxEq.forEach((box, i) => {
        box.group.position.x = weightGroup.children[i].position.x;
        box.group.position.z = weightGroup.position.z;
    });

    opBoxSum.group.position.z = productGroup.position.z;

    const macMeshSize = new THREE.Box3().setFromObject(macMesh).getSize(new THREE.Vector3())
    macMesh.position.x = (opBoxSum.startWidth - macMeshSize.x)/2;
    macMesh.position.y = (- opBoxSum.startHeight + macMeshSize.y)/2;
    macMesh.position.z = opBoxSum.group.position.z + opBoxSum.depth;

    const gridHelper = new THREE.GridHelper(1000, 10);
    const axesHelper = new THREE.AxesHelper(2000);

    // Create scene
    const scene = new THREE.Scene();

    scene.add(inputGroup);
    scene.add(inputColorGroup);

    scene.add(weightGroup);

    scene.add(productGroup);

    opBoxTimes.forEach(box => scene.add(box.group));
    opBoxEq.forEach(box => scene.add(box.group));
    scene.add(opBoxSum.group);

    scene.add(macMesh);

    scene.add(gridHelper);
    scene.add(axesHelper);

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

    // const controls = new OrbitControls(camera, renderEl);

    function render() {
        // [opBoxTimes, opBoxEq, opBoxSum].forEach(b => b.operand.lookAt(camera.position))
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
        // onComplete: animateControl,
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

function getGhostSceneComps(inputNumbers, weightNumbers) {
    const cellSize = 100;
    const strokeWidth = cellSize / 100;
    const numChannels = inputNumbers.length;

    const fillOpacity = 0.05;
    const numberToColor = (x, channel) => {
        if (numChannels === 1) {
            x = Math.round(x * 30 + 70);
            return `hsl(0, 0%, ${x}%)`;
        } else if (numChannels === 3) {
            x = Math.round(x * 255);
            // const hue = [0, 120, 240][channel];
            // return `hsla(${hue}, ${x}%, 50%, 0.5)`;

            const channels = [0, 0, 0];
            channels[channel] = x;
            return `rgba(${channels.join(',')}, 0.1)`;
        }
    };

    const inputGroup = getMultiChannelColoredNumberTable({
        numbers: inputNumbers,
        numberToColor,
        cellSize,
        strokeWidth,
    });
    const inputColorGroup = getColorTable({
        colors: inputNumbers[0].map((row, i) => row.map((x, j) => {
                if (numChannels === 1) {
                    x = Math.round(x*255);
                    return `rgb(${x}, ${x}, ${x})`;
                } else if (numChannels === 3) {
                    const r = Math.round(x*255);
                    const g = Math.round(inputNumbers[1][i][j] * 255);
                    const b = Math.round(inputNumbers[2][i][j] * 255);
                    return `rgb(${r}, ${g}, ${b})`;
                }
            })),
        cellSize,
    });

    const weightGroup = getMultiChannelColoredNumberTable({
        numbers: weightNumbers,
        numberToColor,
        cellSize,
        strokeWidth,
    });

    const productNumbers = inputNumbers.map((ch, i) => elWiseProduct(ch, weightNumbers[i]));
    const productGroup = getMultiChannelColoredNumberTable({
        numbers: productNumbers,
        numberToColor,
        cellSize,
        strokeWidth,
    });
    productGroup.children.forEach(group => {
        group.children.forEach(m => {
            m.material.depthWrite = false;
        });
    });

    const opShift = 1500;
    const opBoxTimes = _.range(numChannels).map(
        () => new OperandBox({
            color: 'darkblue',
            opacity: 0.1,
            depth: opShift,
            startHeight: cellSize,
            opChar: "×",
            opSize: cellSize,
        })
    );
    const opBoxEq = _.range(numChannels).map(
        () => new OperandBox({
            color: 'darkblue',
            opacity: 0.1,
            depth: opShift,
            startHeight: cellSize,
            opChar: "=",
            opSize: cellSize,
        })
    );
    const tableSize = new THREE.Box3().setFromObject(inputGroup).getSize(new THREE.Vector3())
    const opBoxSum = new OperandBox({
        color: 'darkgreen',
        opacity: 0.05,
        depth: opShift/2,
        startWidth: tableSize.x,
        startHeight: tableSize.y,
        endHeight: cellSize,
        opChar: "+",
        opSize: (tableSize.y + cellSize)/2,
    });
    const opBoxActiv = new OperandBox({
        color: 'darkred',
        opacity: 0.1,
        depth: opShift,
        startHeight: cellSize,
        opChar: ">",
        opSize: cellSize,
    });

    const macResult = (productNumbers.flat().flat().reduce((acc, curr) => acc + curr, 0)).toFixed(1);
    const macMesh = getSquareTextMesh({text: macResult, size: cellSize, fillColor: 'white'});

    return {
        inputGroup,
        inputColorGroup,
        weightGroup,
        productGroup,
        opBoxTimes, opBoxEq, opBoxSum,
        macMesh, opShift
    };
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

    const tl = getAnimationTimeline(getGhostSceneComps(inputNumbers, weightNumbers));
    tl.play();
}

window.addEventListener('load', function () {
    main();
})
