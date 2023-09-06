import { idxToNumber } from '../01a-image_palette/image_palette.js';
import ghostIdxsGray from './ghost_gray.js';
import pacmanIdxsGray from './pacman_gray.js';

import { Neuron } from '../03a-multiply_accum_rgb/neuron.js';
import { setDepthWrite } from '../03a-multiply_accum_rgb/pixel_tables.js';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


function getAnimationTimeline({
    neuron, scene
}) {
    const productGroup = neuron.productTable.group;
    const inputGroup = neuron.inputTable.group;
    const weightsGroup = neuron.weightsTable.group;
    const tableSize = neuron.tableSize;
    const cellSize = neuron.cellSize;

    [...neuron.productBoxes, ...neuron.equalsBoxes].forEach(box => {
        box.updateWidthHeight({
            startWidth: cellSize,
            startHeight: cellSize,
            endWidth: cellSize,
            endHeight: cellSize
        })
    });

    neuron.activationBox.group.removeFromParent();
    neuron.outputCell.group.removeFromParent();

    // Create camera
    const canvasWidth = 1920;
    const canvasHeight = 1080;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    camera.position.x = tableSize/2;
    camera.position.y = -tableSize/2;
    camera.position.z = 2000;

    // camera.lookAt(new THREE.Vector3(tableSize/2, -tableSize/2, productGroup.position.z));

    // Render
    const container = document.getElementById('container');
    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(1);
    const renderEl = renderer.domElement;
    container.appendChild(renderEl);
    renderer.setSize(canvasWidth, canvasHeight);

    function render() {
        [
            ...neuron.productBoxes,
            ...neuron.equalsBoxes,
            neuron.sumBox,
            neuron.activationBox
        ].forEach(b => b.operand.lookAt(camera.position))
        renderer.render(scene, camera); 
    }

    function animateControl() {
        render();
        controls.update()
        requestAnimationFrame(animateControl);
    }
    // const controls = new OrbitControls(camera, renderEl);
    // animateControl();

    // Animate
    const tl = gsap.timeline({
        onUpdate: render,
        defaults: {
            ease: "power2.inOut" 
        },
    });

    const veryFast = 0.25;
    const fast = 0.5;
    const moderate = 1;
    const slow = 2;

    tl.set(neuron, {
        colorOpacity: 1.0,
        numberOpacity: 0.0,
    });

    tl.add(() => {}, '+=1');

    tl.to(neuron, {
        colorOpacity: 0.0,
        numberOpacity: 1.0,
        yoyo: true,
        repeat: 1,
        duration: moderate,
    });

    tl.from(neuron.weightsTable, {
        opacity: 0,
        duration: moderate,
    })
        .from(neuron.weightsTable.group.position, {
            z: neuron.inputTable.group.position.z,
            x: neuron.inputTable.group.position.x + tableSize + 100,
            duration: slow,
        }, '<')
        .to(camera.position, {
            x: -2000,
            z: 2500,
            duration: slow,
            onUpdate: () => {
                camera.lookAt(
                    new THREE.Vector3(
                        tableSize/2,
                        -tableSize/2,
                        (inputGroup.position.z + weightsGroup.position.z)/2
                    )
                );
            },
        }, '<')
        .to(neuron, {
            colorOpacity: 0.5,
            numberOpacity: 1.0,
            duration: moderate,
        });

    tl.from([...neuron.productBoxes, ...neuron.equalsBoxes], {
        depth: 0,
        startHeight: 0,
        startWidth: 0,
        endHeight: 0,
        endWidth: 0,
        duration: fast,
        stagger: fast,
    })
        .to(camera.position, {
            z: `+=${neuron.opShift}`,
            duration: fast,
            delay: fast,
        }, '<')

    const productCells = neuron.productTable.cells[0].flat();
    tl.from(productCells[0], {
        opacity: 0,
        duration: fast,
    });

    productCells.slice(1).forEach((cell, idx) => {
        idx++;
        const  numRows = neuron.productTable.cells[0].length;
        const numCols = neuron.productTable.cells[0][0].length;
        const row = Math.floor(idx / numCols);
        const col = idx % numCols;

        const duration = 0.05;
        tl.to([...neuron.productBoxes, ...neuron.equalsBoxes].map(box => box.group.position), {
            x: col * cellSize,
            y: - row * cellSize,
            duration,
        })
            .from(cell, {
                opacity: 0,
                depthWrite: false,
                duration: duration / 2,
            });
    });


    tl.to([...neuron.equalsBoxes, ...neuron.productBoxes], {
        depth: 0,
        startHeight: 0,
        startWidth: 0,
        endHeight: 0,
        endWidth: 0,
        duration: fast,
        stagger: fast,
    })

    tl.from(neuron.sumBox, {
        depth: 0,
        startHeight: 0,
        startWidth: 0,
        endHeight: 0,
        endWidth: 0,
        duration: moderate,
    }).to(camera.position, {
            z: `+=${neuron.opShift}`,
            duration: moderate,
        }, '<')
        .from(neuron.sumCell, {
            opacity: 0,
            duration: fast,
        });

    tl.to(camera.position, {
        x: tableSize / 2,
        y: - tableSize / 2,
        z: neuron.sumCell.group.position.z + 1000,
        duration: fast,
        yoyo: true,
        repeat: 1,
        repeatDelay: 5,
    }).to(camera.rotation, {
        x: 0, y: 0, z: 0,
        duration: fast,
        yoyo: true,
        repeat: 1,
        repeatDelay: 5,
    }, '<')

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
    const neuron = new Neuron({
        input, weights, bias: 50,
        opShift: 1000,
    });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );

    scene.add(neuron.group);

    // const gridHelper = new THREE.GridHelper(1000, 10);
    // scene.add(gridHelper);
    // const axesHelper = new THREE.AxesHelper(2000);
    // scene.add(axesHelper);

    return { neuron, scene };
}


function main() {
    const maxValue = 100;
    const palette = _.range(0, maxValue + 1).map(x => x/maxValue);
    const ghostNumbersGray = idxToNumber(ghostIdxsGray, palette);
    const pacmanNumbersGray = idxToNumber(pacmanIdxsGray, palette);

    const inputNumbers = [pacmanNumbersGray];
    const weightNumbers = [ghostNumbersGray];

    const tl = getAnimationTimeline(getGhostSceneComps(inputNumbers, weightNumbers));
    tl.play();
}

window.addEventListener('load', function () {
    main();
})
