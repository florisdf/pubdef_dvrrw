import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { OperandBox } from '../multiply_accum_gray/operand_box.js';
import { PixelTable } from '../neuron_on_large_image/pixel_tables.js';

import conv1 from './activations/conv1.js';
import layer1 from './activations/layer1.js';
import layer2 from './activations/layer2.js';
import layer3 from './activations/layer3.js';
import layer4 from './activations/layer4.js';


function activationsToColors(acts) {
    return acts.map(ch => ch.map(row => row.map(val => {
        const intVal = Math.round(val * 100);
        return `hsl(${200}, ${50}%, ${intVal}%)`;
    }
    )));
}


function alignCenter(obj) {
    const bbox = new THREE.Box3().setFromObject(obj);
    const size = bbox.getSize(new THREE.Vector3());
    obj.position.y = size.y/2;
    obj.position.x = - size.x/2;
}

function main() {
    const scene = new THREE.Scene();

    const cellSize = 10;
    const layerMargin = 100;

    const pxTableProps = {
        cellSize,
        fillOpacity: 1.0,
        fontOpacity: 0.0,
        bgColor: 'white',
        channelMargin: 20,
        channelDepth: 1,
        channelToColor: (ch, numCh) => `rgb(128, 128, 128)`,
    }

    const conv1Table = new PixelTable({
        ...pxTableProps,
        colors: activationsToColors(conv1),
        values: conv1,
    });
    alignCenter(conv1Table.group);
    scene.add(conv1Table.group);

    const layer1Table = new PixelTable({
        ...pxTableProps,
        colors: activationsToColors(layer1),
        values: layer1,
    });
    alignCenter(layer1Table.group);
    scene.add(layer1Table.group);
    const layer1Size = new THREE.Box3().setFromObject(layer1Table.group).getSize(new THREE.Vector3());
    layer1Table.group.position.z = layer1Size.z + layerMargin;

    const layer2Table = new PixelTable({
        ...pxTableProps,
        colors: activationsToColors(layer2),
        values: layer2,
    });
    alignCenter(layer2Table.group);
    const layer2Size = new THREE.Box3().setFromObject(layer2Table.group).getSize(new THREE.Vector3());
    layer2Table.group.position.z = layer1Table.group.position.z + layer2Size.z + layerMargin;
    scene.add(layer2Table.group);

    const layer3Table = new PixelTable({
        ...pxTableProps,
        colors: activationsToColors(layer3),
        values: layer3,
    });
    alignCenter(layer3Table.group);
    const layer3Size = new THREE.Box3().setFromObject(layer3Table.group).getSize(new THREE.Vector3());
    layer3Table.group.position.z = layer2Table.group.position.z + layer3Size.z + layerMargin;
    scene.add(layer3Table.group);

    const layer4Table = new PixelTable({
        ...pxTableProps,
        colors: activationsToColors(layer4),
        values: layer4,
    });
    alignCenter(layer4Table.group);
    const layer4Size = new THREE.Box3().setFromObject(layer4Table.group).getSize(new THREE.Vector3());
    layer4Table.group.position.z = layer3Table.group.position.z + layer4Size.z + layerMargin;
    scene.add(layer4Table.group);


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
    camera.lookAt(new THREE.Vector3());

    // Render
    const container = document.getElementById('container');
    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: false});
    renderer.setPixelRatio(window.devicePixelRatio)
    const renderEl = renderer.domElement;
    container.appendChild(renderEl);
    renderer.setSize(canvasWidth, canvasHeight);

    function render() {
        renderer.render(scene, camera); 
    }

    const controls = new OrbitControls(camera, renderEl);
    function animateControl() {
        render();
        controls.update()
        requestAnimationFrame(animateControl);
    }
    animateControl();

    // Animate
    const tl = gsap.timeline({
        delay: 2,
        onUpdate: render,
        defaults: {
            ease: "power2.inOut" 
        },
    });

    tl.play();
}

window.addEventListener('load', function () {
    main();
})
