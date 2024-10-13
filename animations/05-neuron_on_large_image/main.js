import { idxToNumber, } from '../01a-image_palette/image_palette.js';
import ghostIdxsRed from './cyan_ghost_red.js';
import ghostIdxsGreen from './cyan_ghost_green.js';
import ghostIdxsBlue from './cyan_ghost_blue.js';
import populatedMaze from './populated_maze.js';
import outputIdxs from './output.js';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { setOpacity } from '../03a-multiply_accum_rgb/pixel_tables.js';

import { OperandBox } from '../03a-multiply_accum_rgb/operand_box.js';
import { PixelTable } from './pixel_tables.js';

import capture from '../lib/capture.js';


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
    color = '#123c75',
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
        fillOpacity: 1.0,
        fontOpacity: 0.0,
        channelToColor: (ch, numCh) => 'black',
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


class OpacityWrapper {
    #opacity
    constructor(group, opacity=1) {
        this.#opacity = opacity;
        this.group = group;
    }
    get opacity() {
        return this.#opacity;
    }
    set opacity(opacity) {
        this.#opacity = opacity;
        setOpacity(this.group, this.#opacity);
    }
}


function main() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    const cellSize = 30;

    const imgTable = new PixelTable({
        cellSize,
        colors: [idxsToRGB(populatedMaze)[0]],
        values: [idxsToValues(populatedMaze)[0]],
        fillOpacity: 1.0,
        fontOpacity: 0.0,
        bgColor: 'white',
        channelToColor: (ch, numCh) => 'black',
    });
    const imgTableNrs = new PixelTable({
        cellSize,
        colors: [idxsToRGB(populatedMaze)[0]],
        values: [idxsToValues(populatedMaze)[0]],
        fillOpacity: 0.0,
        fontOpacity: 1.0,
        bgColor: 'white',
        channelToColor: (ch, numCh) => 'black',
    });
    imgTableNrs.opacity = 0;
    const imgTableCombo = new PixelTable({
        cellSize,
        colors: [idxsToRGB(populatedMaze)[0]],
        values: [idxsToValues(populatedMaze)[0]],
        fillOpacity: 0.3,
        fontOpacity: 1.0,
        bgColor: 'white',
        channelToColor: (ch, numCh) => 'black',
    });
    imgTableCombo.opacity = 0;

    scene.add(imgTable.group);
    scene.add(imgTableNrs.group);
    scene.add(imgTableCombo.group);

    const imgBbox = new THREE.Box3().setFromObject(imgTable.group);
    const imgCenter = imgBbox.getCenter(new THREE.Vector3());
    const imgSize = imgBbox.getSize(new THREE.Vector3());

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
        fillOpacity: 1.0,
        fontOpacity: 0.0,
    });
    outputTable.group.position.z = neuronSize.z;
    outputTable.group.position.x = Math.floor(kernelSize * cellSize / 2) - cellSize / 2;
    outputTable.group.position.y = - Math.floor(kernelSize * cellSize / 2) + cellSize / 2;
    scene.add(outputTable.group);

    // const gridHelper = new THREE.GridHelper(1000, 10);
    // scene.add(gridHelper);
    // const axesHelper = new THREE.AxesHelper(2000);
    // scene.add(axesHelper);

    // Create camera
    const canvasWidth = 1920;
    const canvasHeight = 1080;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    camera.position.x = imgCenter.x;
    camera.position.y = imgCenter.y;
    camera.position.z = imgCenter.z + 8000;
    camera.lookAt(imgCenter);

    // Render
    const container = document.getElementById('container');
    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio)
    const canvas = renderer.domElement;
    container.appendChild(canvas);
    renderer.setSize(canvasWidth, canvasHeight);

    function render() {
        renderer.render(scene, camera); 
    }

    function animateControl() {
        render();
        controls.update()
        requestAnimationFrame(animateControl);
    }
    // const controls = new OrbitControls(camera, canvas);
    // animateControl();

    // Animate
    const tl = gsap.timeline({
        delay: 2,
        onUpdate: render,
        paused: true,
        // onComplete: animateControl,
        defaults: {
            ease: "power2.inOut" 
        },
    });

    tl.add(() => {}, '+=3');

    /**
    tl.to(imgTable, {
        opacity: 0,
        duration: 2,
    }).to(imgTableNrs, {
        opacity: 1,
        duration: 2,
    }, '<');

    tl.to(camera.position, {
        x: imgSize.x/8, y: - imgSize.y/16, z: 1000,
        duration: 2,
        //yoyo: true,
        //repeat: 1,
        //repeatDelay: 2,
    }).to(camera.position, {
        x: imgSize.x - imgSize.x / 8,
        duration: 3,
    }).to(camera.position, {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        duration: 2,
    });

    tl.to(imgTable, {
        opacity: 1,
        duration: 2,
    }).to(imgTableNrs, {
        opacity: 0,
        duration: 2,
    }, '<');
    **/

    // tl.add(() => {}, '+=3');

    tl.from(neuronGroup.position, {
        x: -10000,
        duration: 3,
    });

    tl.to(camera.position, {
        x: imgSize.x/8, y: - imgSize.y/16, z: 2000,
        duration: 2,
    });

    tl.to(imgTable, {
        opacity: 0,
        duration: 2,
    }, '<').to(imgTableCombo, {
        opacity: 1,
        duration: 2,
    }, '<');

    const slowPixels = 5;

    _.range(slowPixels).forEach(i => {
        tl.to(neuronGroup.position, {
            x: i*cellSize,
            duration: 1,
        }).to(outputTable, {
            numPixelsShown: i + 1,
            duration: 1,
        })
    });

    tl.add(() => {}, 'allConv');

    const duration = 0.01;
    _.range(outputTable.numRows).map(row => {
        const numCols = outputTable.numCols - (row === 0 ? slowPixels : 0);
        tl.to(outputTable, {
            numPixelsShown: `+=${numCols}`,
            duration,
            ease: 'linear',
        }).to(neuronGroup.position, {
            x: (numCols - Math.floor(kernelSize/2))*cellSize,
            duration,
            ease: 'linear',
        }, '<').to(neuronGroup.position, {
            x: 0,
            y: `-=${cellSize}`,
            duration,
            ease: 'linear',
        });
    });

    tl.to(camera.position, {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        duration: 2,
    }, 'allConv');

    tl.to(neuronGroup.position, {
        x: -10000,
        duration: 3,
    });

    const inOutMargin = 500;
    tl.to(outputTable.group.position, {
        x: imgSize.x + inOutMargin,
        z: 0,
        duration: 2,
    }).to(camera.position, {
        x: `+=${(imgSize.x + inOutMargin) / 2}`,
        duration: 2,
    }, '<');

    tl.to(imgTable, {
        opacity: 1,
        duration: 2,
    }).to(imgTableCombo, {
        opacity: 0,
        duration: 2,
    }, '<');

    tl.add(() => {}, '+=1');

    return {tl, canvas};
}

window.addEventListener('load', function () {
    const {tl, canvas} = main();

    // tl.play();
    const name = window.location.pathname.split('/').slice(-2)[0];
    capture({tl, canvas, name});
})
