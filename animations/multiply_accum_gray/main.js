import {
    getObjectCenter, getObjectSize,
    floatToGray, floatToGreen, floatToBlue,
    getNumberTable, getColorTable, idxToNumber,
    getSquareTextMesh
} from '../image_palette/image_palette.js';
import * as THREE from '../lib/three.module.js';
import ghostIdxs from './ghost_gray.js';
import pacmanIdxs from './pacman_gray.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


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

class OperandBox {
    constructor({
        color,
        opacity,
        width,
        height,
        depth,
        opChar,
        opSize = height * 2/3,
    }) {
        const geometry = new THREE.BoxGeometry(width, height, depth); 
        const boxColor = new THREE.Color(color);
        const fillMaterial = new THREE.MeshBasicMaterial({
            color: boxColor,
            transparent: true,
            opacity: opacity,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const boxMesh = new THREE.Mesh(geometry, fillMaterial);
        const edgesMesh = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({color: boxColor})
        );

        const boxGroup = new THREE.Group();
        boxGroup.add(boxMesh);
        boxGroup.add(edgesMesh);
        this.box = boxGroup;

        const operandMesh = getSquareTextMesh(opChar, opSize*3/2, 0, 'black', `${opSize}px`);
        this.operand = operandMesh;

        this.group = new THREE.Group();
        this.group.add(this.operand);
        this.group.add(this.box);
        
        this.width = width;
        this.height = height;
        this.depth = depth;
    }
}

function getConnectingOpBox(mesh1, mesh2, opChar, color) {
    const cellSize = getObjectSize(mesh1.clone());
    const center1 = mesh1.localToWorld(mesh1.position.clone());
    const center2 = mesh2.localToWorld(mesh2.position.clone());
    console.log(cellSize)
    // Operand box for multiplication
    const opBox = new OperandBox({
        color: color,
        opacity: 0.1,
        width: center2.x - center1.x,
        height: cellSize.y,
        depth: cellSize.x,
        opChar: opChar,
        opSize: cellSize.y,
    })
    opBox.group.position.x = center1.x + opBox.width / 2;
    opBox.group.position.y = mesh1.position.y;
    opBox.group.position.z = - mesh1.position.x;
    return opBox;
}


function getAnimationTimeline({
    colorGroup, colorMeshes,
    numberGroup, numberMeshes,
    weightColorGroup, weightColorMeshes,
    weightNumberGroup, weightNumberMeshes,
    resultNumberGroup, resultNumberMeshes,
    pixelNumbers, weightNumbers, resultNumbers
}) {
    // Put in initial positions
    const tableSize = getObjectSize(colorGroup);
    const marginX = 200;
    const shiftX = tableSize.x + marginX;
    const shiftY = tableSize.y + 500;

    const cellSize = getObjectSize(colorMeshes[0][0]);

    colorGroup.position.y -= shiftY;
    weightColorGroup.position.y -= shiftY;

    numberGroup.position.x -= shiftX;
    colorGroup.position.x -= shiftX;

    resultNumberGroup.position.x += shiftX;

    numberGroup.position.x += tableSize.x/2;
    weightNumberGroup.position.x += tableSize.x/2;
    resultNumberGroup.position.x += tableSize.x/2;

    numberGroup.rotation.y = Math.PI/2;
    weightNumberGroup.rotation.y = Math.PI/2;
    resultNumberGroup.rotation.y = Math.PI/2;

    const opBoxProd = getConnectingOpBox(numberMeshes[0][0], weightNumberMeshes[0][0], "×", 'darkorange');
    const opBoxEq = getConnectingOpBox(weightNumberMeshes[0][0], resultNumberMeshes[0][0], "=", 'darkorange');

    // Create scene
    const sceneGroup = new THREE.Group();
    sceneGroup.add(numberGroup);
    sceneGroup.add(colorGroup);

    sceneGroup.add(weightColorGroup);
    sceneGroup.add(weightNumberGroup);

    sceneGroup.add(resultNumberGroup);

    sceneGroup.add(opBoxProd.group);
    sceneGroup.add(opBoxEq.group);

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

    const controls = new OrbitControls(camera, renderEl);
    controls.update()

    function render() {
        [opBoxProd, opBoxEq].forEach(b => b.operand.lookAt(camera.position))
        controls.update()
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    render()

    // Animate
    const tl = gsap.timeline({
        delay: 0.5,
        //onUpdate: render,
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
    const cellMarginX = 0;
    const cellMarginY = cellMarginX;
    const precision = 2;
    const strokeColor = 'black';
    const fontSize = `${cellSize*.4}px`;
    const fillColor = 'white';
    const numberTableArgs = [
        cellSize, strokeWidth,
        cellMarginX, cellMarginY,
        precision, strokeColor,
        fontSize, fillColor
    ];

    const {group: numberGroup, meshes: numberMeshes} = getNumberTable(
        pixelNumbers, ...numberTableArgs
    );

    const {group: weightColorGroup, meshes: weightColorMeshes} = getColorTable(floatToGray(weightNumbers), cellSize);
    const {group: weightNumberGroup, meshes: weightNumberMeshes} = getNumberTable(weightNumbers, ...numberTableArgs);

    const resultNumbers = elWiseProduct(pixelNumbers, weightNumbers);
    const {group: resultNumberGroup, meshes: resultNumberMeshes} = getNumberTable(resultNumbers, ...numberTableArgs);

    return {
        colorGroup, colorMeshes,
        numberGroup, numberMeshes,
        weightColorGroup, weightColorMeshes,
        weightNumberGroup, weightNumberMeshes,
        resultNumberGroup, resultNumberMeshes,
        pixelNumbers, weightNumbers, resultNumbers,
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
