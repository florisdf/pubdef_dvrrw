import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { OperandBox } from '../03a-multiply_accum_rgb/operand_box.js';
import { EmptyTable } from './empty_table.js';


import capture from '../lib/capture.js';


function getNeuronGroup({
    blockShift = 100,
    color = '#123c75',
    size = 180,
    kernelSize = 9,
    opacity = 0.2,
} = {}) {
    const neuronGroup = new THREE.Group();

    const prodBox = new OperandBox({
        color,
        opacity,
        depth: blockShift,
        startHeight: size,
        opChar: '×',
    });
    neuronGroup.add(prodBox.group);

    const eqBox = new OperandBox({
        color,
        opacity,
        depth: blockShift,
        startHeight: size,
        opChar: '=',
    });
    eqBox.group.position.z = prodBox.group.position.z + blockShift;
    neuronGroup.add(eqBox.group);

    const cellSize = size/kernelSize;
    const sumBox = new OperandBox({
        color,
        opacity,
        depth: blockShift,
        startHeight: size,
        endHeight: cellSize,
        opChar: '+',
    });
    sumBox.group.position.z = eqBox.group.position.z + blockShift;
    neuronGroup.add(sumBox.group);

    const actBox = new OperandBox({
        color,
        opacity,
        depth: blockShift,
        startHeight: cellSize,
        endHeight: cellSize,
        opChar: '> ... ?',
    });
    actBox.group.position.x = (size - cellSize)/2;
    actBox.group.position.y = - (size - cellSize)/2;
    actBox.group.position.z = sumBox.group.position.z + blockShift;
    neuronGroup.add(actBox.group);

    return {
        neuronGroup, actBox, sumBox, eqBox, prodBox
    };
}


function main() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    const kernelSize = 9;
    const size = 1000;
    const neuronBlockShift = size;
    const channelMargin = 100;

    const weightTable = new EmptyTable({
        cellSize: size / kernelSize,
        numRows: kernelSize,
        strokeColor: '#123c75',
    });
    scene.add(weightTable.group);
    weightTable.group.position.z = neuronBlockShift;

    const {
        neuronGroup, actBox,
        sumBox, eqBox, prodBox
    } =  getNeuronGroup({
        blockShift: neuronBlockShift,
        size,
        kernelSize,
    });
    scene.add(neuronGroup);
    const neuronBox = new THREE.Box3().setFromObject(neuronGroup);
    const neuronCenter = neuronBox.getCenter(new THREE.Vector3());
    const neuronSize = neuronBox.getSize(new THREE.Vector3());

    const eqCenter = new THREE.Box3().setFromObject(eqBox.group).getCenter(new THREE.Vector3());

    // const gridHelper = new THREE.GridHelper(1000, 10);
    // scene.add(gridHelper);
    // const axesHelper = new THREE.AxesHelper(2000);
    // scene.add(axesHelper);

    // Create camera
    const canvasWidth = 1920;
    const canvasHeight = 1080;

    // const fov = 45;
    // const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);
    const cameraWidth = 6*neuronSize.x;
    const cameraHeight = cameraWidth * canvasHeight / canvasWidth;
    const camera = new THREE.OrthographicCamera(-cameraWidth/2, cameraWidth/2, cameraHeight/2, -cameraHeight/2, 1, 100000);

    camera.position.x = -1000;
    camera.position.y = neuronCenter.y + 1000;
    camera.position.z = neuronCenter.z + 1000;
    camera.lookAt(neuronCenter);

    // Render
    const container = document.getElementById('container');
    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(1)
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
        onUpdate: render,
        defaults: {
            ease: "power2.inOut" 
        },
        paused: true,
    });
    tl.add(() => {}, '+=0.1')

    return {tl, canvas};
}

window.addEventListener('load', function () {
    const {tl, canvas} = main();
    // tl.play();
    const name = window.location.pathname.split('/').slice(-2)[0];
    capture({tl, canvas, name});
})
