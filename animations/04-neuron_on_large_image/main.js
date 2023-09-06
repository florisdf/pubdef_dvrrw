import { idxToNumber, } from '../01a-image_palette/image_palette.js';
import ghostIdxsRed from './cyan_ghost_red.js';
import ghostIdxsGreen from './cyan_ghost_green.js';
import ghostIdxsBlue from './cyan_ghost_blue.js';
import populatedMaze from './populated_maze.js';
import outputIdxs from './output.js';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { OperandBox } from '../03a-multiply_accum_rgb/operand_box.js';
import { PixelTable } from './pixel_tables.js';


const toUInt = x => Math.round(x * 255 / 100);
const idxToRGB = (r, g, b) => `rgb(${toUInt(r)}, ${toUInt(g)}, ${toUInt(b)})`;
const idxsToRGB = (values) => values.map(ch => ch.map((row, i) =>
    row.map((val, j) => {
        return idxToRGB(values[0][i][j], values[1][i][j], values[2][i][j]);
    })
));
const monoIdxsToRGB = (values) => values.map((row, i) =>
    row.map((val, j) => {
        return idxToRGB(val, val, val);
    })
);
const idxsToValues = rgb_idxs => rgb_idxs.map(monoIdxsToValues);
const monoIdxsToValues = ch_idxs => ch_idxs.map(row => row.map(idx => idx / 100));



function getNeuronGroup({
    depth = 100,
    color = 'darkblue',
    size = 180,
    cellSize = 20,
    opacity = 0.2,
} = {}) {
    const group = new THREE.Group();

    const prodGroup = new OperandBox({
        color,
        opacity,
        depth: depth/4,
        startHeight: size,
        opChar: '×',
    }).group;
    group.add(prodGroup);

    const ghostIdxs = [ghostIdxsRed, ghostIdxsGreen, ghostIdxsBlue];
    const ghostValues = idxsToValues(ghostIdxs);
    const ghostTable = new PixelTable({
        cellSize,
        colors: idxsToRGB(ghostIdxs),
        values: ghostValues,
    });
    const ghostBox = new THREE.Box3().setFromObject(ghostTable.group);
    ghostTable.group.position.z = depth/4 + ghostBox.getSize(new THREE.Vector3()).z;
    group.add(ghostTable.group);

    const eqGroup = new OperandBox({
        color,
        opacity,
        depth: depth/4,
        startHeight: size,
        opChar: '=',
    }).group;
    eqGroup.position.z = ghostTable.group.position.z;
    group.add(eqGroup);

    const sumGroup = new OperandBox({
        color,
        opacity,
        depth: depth/4,
        startHeight: size,
        endHeight: cellSize,
        opChar: '+',
    }).group;
    sumGroup.position.z = eqGroup.position.z + depth/4;
    group.add(sumGroup);

    const actGroup = new OperandBox({
        color,
        opacity,
        depth: depth/4,
        startHeight: cellSize,
        endHeight: cellSize,
        opChar: '> 50',
    }).group;
    actGroup.position.x = (size - cellSize)/2;
    actGroup.position.y = - (size - cellSize)/2;
    actGroup.position.z = sumGroup.position.z + depth/4;
    group.add(actGroup);

    return group;
}


function main() {
    const scene = new THREE.Scene();

    const cellSize = 10;

    const imgTable = new PixelTable({
        cellSize,
        colors: idxsToRGB(populatedMaze),
        values: idxsToValues(populatedMaze),
        fillOpacity: 0.5,
        fontOpacity: 1.0,
        bgColor: 'white',
    });
    scene.add(imgTable.group);

    const kernelSize = 9;
    const neuronGroup = getNeuronGroup({
        cellSize,
        size: cellSize*kernelSize,
        depth: 500,
    });
    scene.add(neuronGroup);
    const neuronBox = new THREE.Box3().setFromObject(neuronGroup);
    const neuronSize = neuronBox.getSize(new THREE.Vector3());

    const outputTable = new PixelTable({
        colors: [monoIdxsToRGB(outputIdxs)],
        values: [monoIdxsToValues(outputIdxs)],
        cellSize,
        numPixelsShown: 0,
        // fillOpacity: 0.5,
        // fontOpacity: 1.0,
        // bgColor: 'white',
    });
    outputTable.group.position.z = neuronSize.z;
    outputTable.group.position.x = Math.floor(kernelSize * cellSize / 2) - cellSize / 2;
    outputTable.group.position.y = - Math.floor(kernelSize * cellSize / 2) + cellSize / 2;
    scene.add(outputTable.group);

    // const gridHelper = new THREE.GridHelper(1000, 10);
    // scene.add(gridHelper);
    const axesHelper = new THREE.AxesHelper(2000);
    scene.add(axesHelper);

    // Create camera
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    camera.position.x = -3000;
    camera.position.y = 1000;
    camera.position.z = 2000;
    camera.lookAt(neuronBox.getCenter(new THREE.Vector3()));

    // Render
    const container = document.getElementById('container');
    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: false});
    renderer.setPixelRatio(window.devicePixelRatio)
    const renderEl = renderer.domElement;
    container.appendChild(renderEl);
    renderer.setSize(canvasWidth, canvasHeight);

    // const controls = new OrbitControls(camera, renderEl);

    function render() {
        renderer.render(scene, camera); 
    }

    function animateControl() {
        render();
        controls.update()
        requestAnimationFrame(animateControl);
    }
    // animateControl();

    // Animate
    const tl = gsap.timeline({
        delay: 2,
        onUpdate: render,
        // onComplete: animateControl,
        defaults: {
            ease: "power2.inOut" 
        },
    });

    _.range(outputTable.numRows).map(row => {
        const duration = 0.1;
        tl.to(outputTable, {
            numPixelsShown: `+=${outputTable.numCols}`,
            duration,
        }).to(neuronGroup.position, {
            x: (outputTable.numCols - Math.floor(kernelSize/2))*cellSize,
            duration,
        }, '<').to(neuronGroup.position, {
            x: 0,
            y: `-=${cellSize}`,
            duration,
        });
    });

    tl.play();
}

window.addEventListener('load', function () {
    main();
})
