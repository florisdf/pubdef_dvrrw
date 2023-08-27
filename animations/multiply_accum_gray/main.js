import {
    getObjectCenter, getObjectSize,
    floatToGray, floatToGreen, floatToBlue,
    getNumberTable, getColorTable, idxToNumber,
    getSquareTextMesh
} from '../image_palette/image_palette.js';
import * as THREE from '../lib/three.module.js';
import ghostIdxs from './ghost_gray.js';
import pacmanIdxs from './pacman_gray.js';



function elWiseProduct(pixelNumbers, weightNumbers) {
    return pixelNumbers.map((row, i) => row.map((number, j) => number * weightNumbers[i][j]));
}


function getHLineMesh({
    length,
    lineCap = 'round',
    lineWidth,
    color = 'black',
}) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const scale = window.devicePixelRatio;
    canvas.width = Math.floor(length * scale);
    canvas.height = Math.floor(lineWidth * scale);
    ctx.scale(scale, scale);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = lineCap;
    const offsetX = lineCap === 'round' ? lineWidth/2 : 0;
    const offsetY = lineWidth/2;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(length - offsetX, offsetY);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(length, lineWidth), material)

    return mesh;
}

function getAnimationTimeline({
    colorGroup, colorMeshes,
    numberGroup, numberMeshes,
    weightColorGroup, weightColorMeshes,
    weightNumberGroup, weightNumberMeshes,
    resultNumberGroup, resultNumberMeshes,
    timesMesh, equalMesh,
    pixelNumbers, weightNumbers, resultNumbers
}) {
    // Put in initial positions
    const tableSize = getObjectSize(colorGroup);
    const marginX = 400;
    const shiftX = tableSize.x + marginX;
    const shiftY = tableSize.y + 500;

    const cellSize = getObjectSize(colorMeshes[0][0]);

    colorGroup.position.y -= shiftY;
    weightColorGroup.position.y -= shiftY;

    numberGroup.position.x -= shiftX;
    colorGroup.position.x -= shiftX;

    resultNumberGroup.position.x += shiftX;

    const timesMesh2 = timesMesh.clone();

    timesMesh.position.x -= marginX / 2;
    timesMesh.position.y -= tableSize.y / 2;
    equalMesh.position.x += tableSize.x + marginX / 2;
    equalMesh.position.y -= tableSize.y / 2;

    timesMesh2.position.x = timesMesh.position.x;
    timesMesh2.position.y = timesMesh.position.y - shiftY;


    const resultBBox = new THREE.Box3();
    resultBBox.setFromObject(resultNumberGroup);

    // Line for summation
    const resultCenter = getObjectCenter(resultNumberGroup);
    const resultSize = getObjectSize(resultNumberGroup);
    const lineMargin = 100;
    const lineMesh = getHLineMesh({
        length: resultSize.x*1.1,
        lineCap: 'round',
        lineWidth: 5
    });
    lineMesh.position.x = resultCenter.x;
    lineMesh.position.y = resultCenter.y - resultSize.y / 2 - lineMargin;

    // Create scene
    const sceneGroup = new THREE.Group();
    sceneGroup.add(numberGroup);
    sceneGroup.add(colorGroup);

    sceneGroup.add(weightColorGroup);
    sceneGroup.add(weightNumberGroup);

    sceneGroup.add(resultNumberGroup);

    sceneGroup.add(timesMesh);
    sceneGroup.add(equalMesh);
    sceneGroup.add(timesMesh2);

    sceneGroup.add(lineMesh);

    const scene = new THREE.Scene();
    scene.add(sceneGroup);

    // Create camera
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    const sceneCenter = getObjectCenter(sceneGroup);
    camera.position.x = sceneCenter.x;
    camera.position.y = sceneCenter.y;
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

    const colorMaterials = colorMeshes.flat().map(mesh => mesh.material);
    const weightMaterials = weightColorMeshes.flat().map(mesh => mesh.material);

    return tl;
}


function getGhostSceneComps(pixelNumbers, weightNumbers) {
    const cellSize = 100;
    const {group: colorGroup, meshes: colorMeshes} = getColorTable(floatToGray(pixelNumbers), cellSize);

    colorGroup.position.z += 10;

    const strokeWidth = cellSize / 100;
    const {group: numberGroup, meshes: numberMeshes} = getNumberTable(pixelNumbers, cellSize, strokeWidth);

    const {group: weightColorGroup, meshes: weightColorMeshes} = getColorTable(floatToGray(weightNumbers), cellSize);
    const {group: weightNumberGroup, meshes: weightNumberMeshes} = getNumberTable(weightNumbers, cellSize, strokeWidth);

    const resultNumbers = elWiseProduct(pixelNumbers, weightNumbers);
    const {group: resultNumberGroup, meshes: resultNumberMeshes} = getNumberTable(resultNumbers, cellSize, strokeWidth);

    const timesMesh = getSquareTextMesh("×", cellSize * 8, 0);
    const equalMesh = getSquareTextMesh("=", cellSize * 8, 0);

    return {
        colorGroup, colorMeshes,
        numberGroup, numberMeshes,
        weightColorGroup, weightColorMeshes,
        weightNumberGroup, weightNumberMeshes,
        resultNumberGroup, resultNumberMeshes,
        pixelNumbers, weightNumbers, resultNumbers,
        timesMesh, equalMesh
    };
}


function main() {
    const maxValue = 100;
    const palette = _.range(0, maxValue + 1).map(x => x/maxValue);
    const pixelNumbers = idxToNumber(ghostIdxs, palette);
    const weightNumbers = idxToNumber(pacmanIdxs, palette);

    const tl = getAnimationTimeline(getGhostSceneComps(pixelNumbers, weightNumbers));
    tl.play();
}

window.addEventListener('load', function () {
    main();
})
