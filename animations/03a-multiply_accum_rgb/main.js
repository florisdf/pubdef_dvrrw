import { idxToNumber } from '../01a-image_palette/image_palette.js';
import ghostIdxsRed from './cyan_ghost_red.js';
import ghostIdxsGreen from './cyan_ghost_green.js';
import ghostIdxsBlue from './cyan_ghost_blue.js';

import { Neuron } from './neuron.js';
import { setDepthWrite } from './pixel_tables.js';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


function getAnimationTimeline({
    neuron, scene
}) {
    const productGroup = neuron.productTable.group;
    const productGroupBbox = new THREE.Box3().setFromObject(productGroup);
    const productGroupCenter = productGroupBbox.getCenter(new THREE.Vector3());

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

    camera.position.x = productGroupCenter.x;
    camera.position.y = productGroupCenter.y;
    camera.position.z = 2300;

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

    // Move RGB channels apart
    tl.from([neuron.inputTable, neuron.weightsTable, neuron.productTable], {
        channelMargin: -tableSize,
        duration: 2,
    }).from(camera.position, {
        x: tableSize / 2,
        duration: 2,
    }, '<');

    // Bring in weights and move camera to side
    tl.to(camera.position, {
            x: -2000,
            z: 2500,
            duration: slow,
            onUpdate: () => {
                camera.lookAt(
                    new THREE.Vector3(
                        productGroupCenter.x,
                        productGroupCenter.y,
                        inputGroup.position.z
                    )
                );
            },
        })
        .from(neuron.weightsTable, {
            opacity: 0,
            duration: moderate,
        })
        .from(neuron.weightsTable.group.position, {
            z: '+=5000',
            duration: slow,
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

    // Slide product and equals boxes over image cells
    neuron.productTable.cells.forEach((channelCells, channelIdx) => {
        const productCells = channelCells.flat();
        tl.from(productCells[0], {
            opacity: 0,
            duration: fast,
        }, 'cell0');

        productCells.slice(1).forEach((cell, idx) => {
            idx++;
            const  numRows = neuron.productTable.cells[0].length;
            const numCols = neuron.productTable.cells[0][0].length;
            const row = Math.floor(idx / numCols);
            const col = idx % numCols;

            const duration = 0.05;
            tl.to([neuron.productBoxes[channelIdx], neuron.equalsBoxes[channelIdx]].map(box => box.group.position), {
                x: col === 0 ? `-=${tableSize - cellSize}` : `+=${cellSize}`,
                y: - row * cellSize,
                duration,
            }, `cell${idx}`)
                .from(cell, {
                    opacity: 0,
                    depthWrite: false,
                    duration: duration / 2,
                }, `cell${idx}+=100%`);
        });
    });

    // Hide product and equals boxes
    tl.to(neuron.equalsBoxes, {
        depth: 0,
        startHeight: 0,
        startWidth: 0,
        endHeight: 0,
        endWidth: 0,
        duration: fast,
    }).to(neuron.productBoxes, {
        depth: 0,
        startHeight: 0,
        startWidth: 0,
        endHeight: 0,
        endWidth: 0,
        duration: fast,
    })

    // Show sum box and sum
    tl.from(neuron.sumBox, {
        depth: 0,
        startHeight: 0,
        startWidth: 0,
        endHeight: 0,
        endWidth: 0,
        duration: slow,
    }).to(camera.position, {
            z: `+=${neuron.opShift}`,
            duration: slow,
        }, '<')
        .from(neuron.sumCell, {
            opacity: 0,
            duration: moderate,
        });

    // Move camera to sum
    tl.to(camera.position, {
        x: productGroupCenter.x,
        y: productGroupCenter.y,
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

    const ghostNumbersRed = idxToNumber(ghostIdxsRed, palette);
    const ghostNumbersGreen = idxToNumber(ghostIdxsGreen, palette);
    const ghostNumbersBlue = idxToNumber(ghostIdxsBlue, palette);
    const ghostNumbersRGB = [ghostNumbersRed, ghostNumbersGreen, ghostNumbersBlue];

    const inputNumbers = ghostNumbersRGB;
    const weightNumbers = ghostNumbersRGB;

    const tl = getAnimationTimeline(getGhostSceneComps(inputNumbers, weightNumbers));
    tl.play();
}

window.addEventListener('load', function () {
    main();
})
