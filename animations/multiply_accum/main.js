import {
    getObjectCenter, getObjectSize,
    floatToRed, floatToGreen, floatToBlue,
    getNumberTable, getColorTable, idxToNumber,
    getSquareTextMesh
} from '../image_palette/image_palette.js';
import * as THREE from '../lib/three.module.js';
import cyanGhostRed from './cyan_ghost_red.js';
import cyanGhostGreen from './cyan_ghost_green.js';
import cyanGhostBlue from './cyan_ghost_blue.js';


function getAnimationTimeline({
    redColorGroup, redColorMeshes,
    redNumberGroup, redNumberMeshes,
    greenColorGroup, greenColorMeshes,
    greenNumberGroup, greenNumberMeshes,
    blueColorGroup, blueColorMeshes,
    blueNumberGroup, blueNumberMeshes,
    redWeightGroup, redWeightMeshes,
    greenWeightGroup, greenWeightMeshes,
    blueWeightGroup, blueWeightMeshes,
    redNumbers, greenNumbers, blueNumbers,
}) {
    // Put in initial positions
    const tableSize = getObjectSize(redColorGroup);
    const shiftX = tableSize.x + 100
    const shiftY = tableSize.y + 100

    redWeightGroup.position.x -= shiftX;
    blueWeightGroup.position.x += shiftX;

    // Create scene
    const sceneGroup = new THREE.Group();
    sceneGroup.add(redNumberGroup);
    sceneGroup.add(greenNumberGroup);
    sceneGroup.add(blueNumberGroup);

    sceneGroup.add(redColorGroup);
    sceneGroup.add(greenColorGroup);
    sceneGroup.add(blueColorGroup);

    sceneGroup.add(redWeightGroup);
    sceneGroup.add(greenWeightGroup);
    sceneGroup.add(blueWeightGroup);

    const scene = new THREE.Scene();
    scene.add(sceneGroup);

    // Create camera
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    const sceneCenter = getObjectCenter(sceneGroup);
    camera.position.x = sceneCenter.x;
    camera.position.y = sceneCenter.y - shiftY/2;
    camera.position.z += 3500;

    // Render
    const container = document.getElementById('container');
    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio)
    const renderEl = renderer.domElement;
    container.appendChild(renderEl);
    renderer.setSize(canvasWidth, canvasHeight);

    function render() {
        renderer.render(scene, camera);
    }

    // Animate
    const tl = gsap.timeline({
        delay: 0.5,
        onUpdate: render,
        defaults: {
            ease: "power2.inOut" 
        },
    });

    const colorMeshes = [redColorMeshes, greenColorMeshes, blueColorMeshes].flat().flat();
    const colorMaterials = colorMeshes.map(mesh => mesh.material);

    const allWeightMeshes = [redWeightMeshes, greenWeightMeshes, blueWeightMeshes].flat().flat();
    const weightMaterials = allWeightMeshes.map(mesh => mesh.material);

    // Split image channels, convert to numbers and duplicate numbers
    tl.to(
        [redColorGroup.position, redNumberGroup.position], {
            x: `-=${shiftX}`
        },
        'chShift'
    ).to(
        [blueColorGroup.position, blueNumberGroup.position], {
            x: `+=${shiftX}`
        },
        'chShift'
    ).to(colorMaterials, {
        opacity: 0
    }).from(weightMaterials, {
        opacity: 0
    }).to(
        [redWeightGroup.position, greenWeightGroup.position, blueWeightGroup.position], {
            y: `-=${shiftY}`,
        }
    );

    tl.add(
        animateTablesToMAC({
            pixelMeshes: redNumberMeshes,
            weightMeshes: redWeightMeshes,
            pixelNumbers: redNumbers,
            weightNumbers: redNumbers,
            shiftX: -shiftX, shiftY, scene
        })
    ).add(
        animateTablesToMAC({
            pixelMeshes: greenNumberMeshes,
            weightMeshes: greenWeightMeshes,
            pixelNumbers: greenNumbers,
            weightNumbers: greenNumbers,
            shiftX: 0, shiftY, scene
        })
    ).add(
        animateTablesToMAC({
            pixelMeshes: blueNumberMeshes,
            weightMeshes: blueWeightMeshes,
            pixelNumbers: blueNumbers,
            weightNumbers: blueNumbers,
            shiftX, shiftY, scene
        })
    );

    return tl;
}


function animateTablesToMAC({
    pixelMeshes, weightMeshes, 
    pixelNumbers, weightNumbers,
    shiftX, shiftY, scene
}) {
    const firstMesh = pixelMeshes[0][0];
    const cellSize = getObjectSize(firstMesh).x;

    const eqnShiftX = cellSize + 10;
    const eqnShiftY = cellSize + 10;
    const firstMeshLocal = firstMesh.position;
    const firstMeshGlobal = firstMesh.getWorldPosition(new THREE.Vector3());

    const tl = gsap.timeline({
        defaults: {
            ease: "power2.inOut",
        },
    });

    pixelMeshes.forEach((row, i) => {
        row.forEach((pixelMesh, j) => {
            const pixel = pixelNumbers[i][j];
            const weight = weightNumbers[i][j];
            const weightMesh = weightMeshes[i][j];

            const result = (pixel * weight).toFixed(2);
            const resultMesh = getSquareTextMesh(result, cellSize, 0);

            const timesMesh = getSquareTextMesh("×", cellSize, 0);
            const equalMesh = getSquareTextMesh("=", cellSize, 0);

            scene.add(timesMesh);
            scene.add(equalMesh);
            scene.add(resultMesh);

            const pixelSrcPos = pixelMesh.getWorldPosition(new THREE.Vector3());
            const weightSrcPos = weightMesh.getWorldPosition(new THREE.Vector3());
            const posYDiff = - (j + i*row.length) * eqnShiftY;

            timesMesh.position.x = firstMeshGlobal.x + eqnShiftX + shiftX;
            timesMesh.position.y = firstMeshLocal.y + posYDiff;
            equalMesh.position.x = firstMeshGlobal.x + 3*eqnShiftX + shiftX;
            equalMesh.position.y = firstMeshLocal.y + posYDiff;
            resultMesh.position.x = firstMeshGlobal.x + 4*eqnShiftX + shiftX;
            resultMesh.position.y = firstMeshLocal.y + posYDiff;

            const pixelMeshDstPos = new THREE.Vector3(firstMeshLocal.x, firstMeshLocal.y + posYDiff);
            const weightMeshDstPos = new THREE.Vector3(firstMeshLocal.x + 2*eqnShiftX, firstMeshLocal.y + shiftY + posYDiff);

            tl.to(pixelMesh.position, {
                x: pixelMeshDstPos.x,
                y: pixelMeshDstPos.y,
                duration: 3,
            }, 'mac').to(weightMesh.position, {
                x: weightMeshDstPos.x,
                y: weightMeshDstPos.y,
                duration: 3,
            }, 'mac').from(timesMesh.position, {
                y: "-=10"
            }, '>').from(timesMesh.material, {
                opacity: 0
            }, '<').from(equalMesh.position, {
                y: "-=10"
            }, '>').from(equalMesh.material, {
                opacity: 0
            }, '<').from(resultMesh.position, {
                y: "-=10"
            }, '>').from(resultMesh.material, {
                opacity: 0
            }, '<')
        })
    })
    return tl;
}


function getCyanGhostSceneComps() {
    const maxValue = 100;
    const palette = _.range(0, maxValue + 1).map(x => x/maxValue);

    const cellSize = 100;
    const [redIdxs, greenIdxs, blueIdxs] = [cyanGhostRed, cyanGhostGreen, cyanGhostBlue];
    const [redNumbers, greenNumbers, blueNumbers] = [
        idxToNumber(redIdxs, palette),
        idxToNumber(greenIdxs, palette),
        idxToNumber(blueIdxs, palette)
    ];
    const {group: redColorGroup, meshes: redColorMeshes} = getColorTable(floatToRed(redNumbers), cellSize);
    const {group: greenColorGroup, meshes: greenColorMeshes} = getColorTable(floatToGreen(greenNumbers), cellSize);
    const {group: blueColorGroup, meshes: blueColorMeshes} = getColorTable(floatToBlue(blueNumbers), cellSize);

    redColorGroup.position.z += 10;
    greenColorGroup.position.z += 10;
    blueColorGroup.position.z += 10;

    [redColorMeshes, greenColorMeshes, blueColorMeshes].forEach(meshes => {
        meshes.flat().forEach(mesh => {
            mesh.material.blending = THREE.AdditiveBlending;
        });
    });

    const strokeWidth = cellSize / 100;
    const {group: redNumberGroup, meshes: redNumberMeshes} = getNumberTable(redNumbers, cellSize, strokeWidth);
    const {group: greenNumberGroup, meshes: greenNumberMeshes} = getNumberTable(greenNumbers, cellSize, strokeWidth);
    const {group: blueNumberGroup, meshes: blueNumberMeshes} = getNumberTable(blueNumbers, cellSize, strokeWidth);

    const weightColor = "#00008B";
    const {group: redWeightGroup, meshes: redWeightMeshes} = getNumberTable(redNumbers, cellSize, strokeWidth, 0, 0, 2, weightColor);
    const {group: greenWeightGroup, meshes: greenWeightMeshes} = getNumberTable(greenNumbers, cellSize, strokeWidth, 0, 0, 2, weightColor);
    const {group: blueWeightGroup, meshes: blueWeightMeshes} = getNumberTable(blueNumbers, cellSize, strokeWidth, 0, 0, 2, weightColor);

    return {
        redColorGroup, redColorMeshes,
        redNumberGroup, redNumberMeshes,
        greenColorGroup, greenColorMeshes,
        greenNumberGroup, greenNumberMeshes,
        blueColorGroup, blueColorMeshes,
        blueNumberGroup, blueNumberMeshes,
        redWeightGroup, redWeightMeshes,
        greenWeightGroup, greenWeightMeshes,
        blueWeightGroup, blueWeightMeshes,
        redNumbers, greenNumbers, blueNumbers,
    };
}


function main() {
    const tl = getAnimationTimeline(getCyanGhostSceneComps());
    tl.play();
}

window.addEventListener('load', function () {
    main();
})
