import { idxToNumber } from '../01a-image_palette/image_palette.js';
import ghostIdxsGray from './ghost_gray.js';
import pacmanIdxsGray from './pacman_gray.js';

import { Neuron } from '../03a-multiply_accum_rgb/neuron.js';
import { setDepthWrite } from '../03a-multiply_accum_rgb/pixel_tables.js';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import capture from '../lib/capture.js';

const maxValue = 100;
const palette = _.range(0, maxValue + 1).map(x => x/maxValue);
const ghostNumbersGray = idxToNumber(ghostIdxsGray, palette);
const pacmanNumbersGray = idxToNumber(pacmanIdxsGray, palette);


function getAnimationTimeline() {
    // Create scene
    const neuronGhost = new Neuron({
        input: [ghostNumbersGray],
        weights: [ghostNumbersGray],
        bias: 30,
        opShift: 1000,
        colorOpacity: 1.0,
        numberOpacity: 0.0,
    });

    const neuronPacMan = new Neuron({
        input: [pacmanNumbersGray],
        weights: [ghostNumbersGray],
        bias: 30,
        opShift: 1000,
        colorOpacity: 1.0,
        numberOpacity: 0.0,
    });

    neuronPacMan.outputCell.updateStyle({
        fontOpacity: 1.0,
        fillOpacity: 0.0,
    });
    neuronGhost.outputCell.updateStyle({
        fontOpacity: 1.0,
        fillOpacity: 0.0,
    });

    const neuronsGroup = new THREE.Group();
    neuronsGroup.add(neuronGhost.group);
    neuronsGroup.add(neuronPacMan.group);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    scene.add(neuronsGroup);

    // const gridHelper = new THREE.GridHelper(1000, 10);
    // scene.add(gridHelper);
    // const axesHelper = new THREE.AxesHelper(2000);
    // scene.add(axesHelper);

    const tableSize = neuronGhost.tableSize;
    const cellSize = neuronGhost.cellSize;

    const neuronMargin = 500;
    neuronGhost.group.position.y += tableSize + neuronMargin;

    // Create camera
    const canvasWidth = 1920;
    const canvasHeight = 1080;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    const neuronsBbox = new THREE.Box3().setFromObject(neuronsGroup);
    const neuronsCenter = neuronsBbox.getCenter(new THREE.Vector3());

    camera.position.x = -3000;
    camera.position.y = neuronsCenter.y;
    camera.position.z = 4000;

    camera.lookAt(neuronsCenter);

    // Render
    const container = document.getElementById('container');
    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(1);
    const canvas = renderer.domElement;
    container.appendChild(canvas);
    renderer.setSize(canvasWidth, canvasHeight);

    function render() {
        [neuronGhost, neuronPacMan].forEach(neuron => {
            [
                ...neuron.productBoxes,
                ...neuron.equalsBoxes,
                neuron.sumBox,
                neuron.activationBox
            ].forEach(b => b.operand.lookAt(camera.position))
            // neuron.sumCell.group.lookAt(camera.position)
        });
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

    // Show sum result to camera
    [neuronGhost, neuronPacMan].forEach(neuron => {
        tl.to(neuron.sumCell.group.rotation, {
            y: - Math.PI / 2,
            duration: 2,
            yoyo: true,
            repeat: 1,
        }).to(neuron.sumCell.group.scale, {
            x: 5,
            y: 5,
            duration: 2,
            yoyo: true,
            repeat: 1,
        }, '<');
    });

    tl.from(neuronGhost.activationBox, {
        depth: 0,
        startHeight: 0,
        startWidth: 0,
        endHeight: 0,
        endWidth: 0,
        duration: 3,
    })
        .to(camera.position, {
            z: `+=${neuronGhost.opShift}`,
            duration: 3
        }, '<')
        .from(neuronGhost.outputCell, {
            opacity: 0,
            depthWrite: false,
        });

    // Rotate output to camera and back
    tl.to(neuronGhost.outputCell.group.rotation, {
        y: - Math.PI / 2,
        duration: 2,
        yoyo: true,
        repeat: 1,
    }).to(neuronGhost.outputCell.group.scale, {
        x: 5,
        y: 5,
        duration: 2,
        yoyo: true,
        repeat: 1,
    }, '<');

    // Activation of PacMan neuron
    tl.from(neuronPacMan.activationBox, {
        depth: 0,
        startHeight: 0,
        startWidth: 0,
        endHeight: 0,
        endWidth: 0,
        duration: 3,
    }).from(neuronPacMan.outputCell, {
        opacity: 0,
        depthWrite: false,
    }).to(neuronPacMan.outputCell.group.rotation, {
        y: - Math.PI / 2,
        duration: 2,
        yoyo: true,
        repeat: 1,
    }).to(neuronPacMan.outputCell.group.scale, {
        x: 5,
        y: 5,
        duration: 2,
        yoyo: true,
        repeat: 1,
    }, '<');

    tl.add(() => {}, '+=1');
    return {tl, canvas};
}


window.addEventListener('load', function () {
    const {tl, canvas} = getAnimationTimeline();
    // tl.play();
    const name = window.location.pathname.split('/').slice(-2)[0];
    capture({tl, canvas, name});
})
