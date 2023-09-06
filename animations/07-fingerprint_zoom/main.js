import { idxToNumber } from '../01a-image_palette/image_palette.js';
import fingerprint from './waldek_fp.js';

import { PixelTable, setDepthWrite } from '../03a-multiply_accum_rgb/pixel_tables.js';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import capture from '../lib/capture.js';


const toUInt = x => Math.round(x * 255);

function getAnimationTimeline() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    const cellSize = 10;

    const fpTable = new PixelTable({
        values: fingerprint,
        valueToColor: (val, ch) => `rgb(${toUInt(val)}, ${toUInt(val)}, ${toUInt(val)})`,
        cellSize,
        strokeWidth: 0,
        fontOpacity: 0.0,
        cellMarginX: 100,
        cellMarginY: 100,
    });
    scene.add(fpTable.group);
    const fpBbox = new THREE.Box3().setFromObject(fpTable.group);
    const tableSize = fpBbox.getSize(new THREE.Vector3());

    // Create camera
    const canvasWidth = 1920;
    const canvasHeight = 1080;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    camera.position.x = tableSize.x/2;
    camera.position.y = -tableSize.y/2;
    camera.position.z = 3000;

    // camera.lookAt(new THREE.Vector3(tableSize/2, -tableSize/2, productGroup.position.z));

    // Render
    const container = document.getElementById('container');
    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(1);
    const canvas = renderer.domElement;
    container.appendChild(canvas);
    renderer.setSize(canvasWidth, canvasHeight);

    // const axesHelper = new THREE.AxesHelper(2000);
    // scene.add(axesHelper);

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

    tl.add(() => {}, '+=2');

    const table = fpTable.tables[0];
    tl.to(table, {
        duration: 3,
        cellMarginX: 0,
        cellMarginY: 0,
        onUpdate: () => {
            camera.position.x = table.size.x / 2;
            camera.position.y = - table.size.y / 2;
        }
    }).to(camera.position, {
        z: 500,
        duration: 3,
    }, '<');

    return {tl, canvas};
}


function main() {
    const {tl, canvas} = getAnimationTimeline();
    // tl.play();
    const name = window.location.pathname.split('/').slice(-2)[0];
    capture({tl, canvas, name});
}

window.addEventListener('load', function () {
    main();
})
