import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { OperandBox } from '../03a-multiply_accum_rgb/operand_box.js';
import { EmptyTable } from './empty_table.js';


import capture from '../lib/capture.js';


function getNeuronGroup({
    blockShift = 100,
    color = 'darkblue',
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

    const inputTable = new EmptyTable({
        cellSize: size / kernelSize,
        numRows: kernelSize,
    });

    const inputTable2 = new EmptyTable({
        cellSize: size / kernelSize,
        numRows: kernelSize,
    });
    inputTable2.group.position.y -= size + channelMargin;

    const inputTable3 = new EmptyTable({
        cellSize: size / kernelSize,
        numRows: kernelSize,
    });
    inputTable3.group.position.y -= 2*(size + channelMargin);

    scene.add(inputTable.group);
    scene.add(inputTable2.group);
    scene.add(inputTable3.group);

    const weightTable = new EmptyTable({
        cellSize: size / kernelSize,
        numRows: kernelSize,
    });

    const weightTable2 = new EmptyTable({
        cellSize: size / kernelSize,
        numRows: kernelSize,
    });
    weightTable2.group.position.y -= size + channelMargin;

    const weightTable3 = new EmptyTable({
        cellSize: size / kernelSize,
        numRows: kernelSize,
    });
    weightTable3.group.position.y -= 2*(size + channelMargin);

    scene.add(weightTable.group);
    scene.add(weightTable2.group);
    scene.add(weightTable3.group);
    weightTable.group.position.z = neuronBlockShift;
    weightTable2.group.position.z = neuronBlockShift;
    weightTable3.group.position.z = neuronBlockShift;

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

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);
    // const cameraWidth = 7*size;
    // const cameraHeight = cameraWidth * canvasHeight / canvasWidth;
    // const camera = new THREE.OrthographicCamera(0, cameraWidth, 0, cameraHeight, 1, 100000);

    camera.position.x = -4700;
    camera.position.y = eqCenter.y + 1000;
    camera.position.z = eqCenter.z;
    camera.lookAt(eqCenter);

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

    tl.add(() => {}, '+=1');

    const compMargin = 500;

    // Explode neuron
    const explosionTl = gsap.timeline({
        defaults: {
            ease: "elastic.out(1, 0.3)",
            duration: 2,
        },
        onComplete: () => {
            inputTable2.group.position.z = inputTable.group.position.z;
            inputTable3.group.position.z = inputTable.group.position.z;
            weightTable2.group.position.z = weightTable.group.position.z;
            weightTable3.group.position.z = weightTable.group.position.z;
        }
    });

    let aggShift = 0;
    [inputTable, prodBox, weightTable, eqBox, sumBox, actBox].forEach((box, i, arr) => {
        const shift = [2, 3].includes(i) ? compMargin / 4 : compMargin;
        aggShift += shift;
        explosionTl.to(box.group.position, {
            z: `+=${aggShift - neuronSize.z/2}`
        }, 'explosion')
    })
    tl.add(explosionTl);

    // Show weights and bias
    const showParams = gsap.timeline({
        defaults: {
            duration: 1,
            yoyo: true,
            repeat: 1,
            repeatDelay: 2,
            ease: "power2.inOut" 
        }
    });
    showParams.to(weightTable.group.position, {
        y: `+=${size*1.2}`,
    }).to(actBox.operandCell.group.position, {
        y: `+=${size*1.2}`,
    }).to(actBox.operandCell.group.scale, {
        x: 5,
        y: 5,
    }, '<');
    tl.add(showParams);

    tl.add(() => {}, '+=5')

    // Show input
    tl.from(inputTable, {
        opacity: 0,
        duration: 1,
    }).from(inputTable.group.position, {
        y: `-=${size}`,
        duration: 1,
    }, '<');

    tl.add(() => {}, '+=3')

    // Add extra input channels
    const addExtraChannels = gsap.timeline({
        defaults: {
            duration: 1,
        }
    });
    addExtraChannels.from([inputTable2, inputTable3, weightTable2, weightTable3], {
        opacity: 0,
    }).to([
        inputTable, inputTable2, inputTable3,
        weightTable, weightTable2, weightTable3
    ].map(t => t.group.position), {
        y: `+=${channelMargin + size}`,
    }, '<');
    tl.add(addExtraChannels);

    tl.add(() => {}, '+=1')
    return {tl, canvas};
}

window.addEventListener('load', function () {
    const {tl, canvas} = main();
    // tl.play();
    const name = window.location.pathname.split('/').slice(-2)[0];
    capture({tl, canvas, name});
})
