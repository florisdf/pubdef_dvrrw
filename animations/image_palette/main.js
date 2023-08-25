import { idxToNumber, getNumberTable, getColorTable, floatToGray } from '../lib/anims.js';
import * as THREE from '../lib/three.module.js';
import waldek from './waldek_the_gray.js';

function runAnimation() {
    const container = document.getElementById('container');
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    const stepSize = 15;
    const maxValue = 100;
    const paletteTable = _.range(0, maxValue + 1, stepSize).map(x => _.range(x, Math.min(x + stepSize, maxValue + 1)).map(x => x/maxValue));
    const flatPalette = paletteTable.flat();

    const cellSize = 100;
    const colorIdxs = waldek;
    const numRows = colorIdxs.length;
    const numCols = Math.max(...colorIdxs.map(row => row.length));
    const numbers = idxToNumber(colorIdxs, flatPalette);

    const fov = 45;
    let camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);
    const tableWidth = numCols * cellSize;
    const tableHeight = numRows * cellSize;

    let scene = new THREE.Scene();

    const {group: numberTable, meshes: numberMeshes} = getNumberTable(
        numbers, cellSize, 3, 0, 0, 2
    )

    const tableBox = new THREE.Box3();
    tableBox.setFromObject(numberTable);
    let tableCenter = new THREE.Vector3();
    tableBox.getCenter(tableCenter);
    let tableSize = new THREE.Vector3();
    tableBox.getSize(tableSize);

    camera.position.z = tableCenter.z + 6250;
    camera.position.x = tableCenter.x;
    camera.position.y = tableCenter.y;

    // const colors = floatToGray(numbers);
    // const {group: colorTable, meshes: colorMeshes} = getColorTable(colors, cellSize)
    // colorTable.position.x = numberTable.position.x;
    // colorTable.position.y = numberTable.position.y + tableSize.y + 10;
    // scene.add(colorTable);

    const paletteCellSize = 2 * cellSize;
    const marginX = paletteCellSize / 5;
    const marginY = paletteCellSize + marginX;
    const {
        group: paletteColorGroup,
        meshes: paletteColorMeshes
    } = getColorTable(floatToGray(paletteTable), paletteCellSize, 0, marginX, marginY, 'black')

    const paletteBox = new THREE.Box3();
    paletteBox.setFromObject(paletteColorGroup);
    let paletteSize = new THREE.Vector3();
    paletteBox.getSize(paletteSize);

    paletteColorGroup.position.x = numberTable.position.x - paletteSize.x - tableSize.x/2;
    paletteColorGroup.position.y = numberTable.position.y + (paletteSize.y - tableSize.y) / 2;
    paletteColorGroup.position.z = numberTable.position.z;

    const {
        group: paletteNumberGroup,
        meshes: paletteNumberMeshes
    } = getNumberTable(paletteTable, paletteCellSize, 0, marginX, marginY)
    paletteNumberGroup.position.x = paletteColorGroup.position.x;
    paletteNumberGroup.position.y = paletteColorGroup.position.y - paletteCellSize;
    paletteNumberGroup.position.z = paletteColorGroup.position.z;

    const paletteGroup = new THREE.Group();
    paletteGroup.add(paletteColorGroup);
    paletteGroup.add(paletteNumberGroup);
    const paletteGroupBox = new THREE.Box3();
    paletteGroupBox.setFromObject(paletteGroup);
    let paletteGroupCenter = new THREE.Vector3();
    paletteGroupBox.getCenter(paletteGroupCenter);

    const sceneGroup = new THREE.Group();
    sceneGroup.add(numberTable);
    sceneGroup.add(paletteGroup);
    const sceneBox = new THREE.Box3();
    sceneBox.setFromObject(sceneGroup);
    let sceneCenter = new THREE.Vector3();
    sceneBox.getCenter(sceneCenter);
    scene.add(sceneGroup);

    let renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio)
    const renderEl = renderer.domElement;
    renderEl.style.position = 'absolute';
    renderEl.style.top = 0;
    renderEl.style.left = 0;
    container.appendChild(renderEl);
    renderer.domElement.style.margin = "auto"
    renderer.setSize(canvasWidth, canvasHeight);

    function render() {
        renderer.render(scene, camera);
    }
    render()

    const paletteDests = flatPalette.map(() => []);
    colorIdxs.forEach((row, i) => {
        row.forEach((paletteIdx, j) => {
            paletteDests[paletteIdx].push([i, j]);
        });
    });

    const flatPaletteMeshes = paletteColorMeshes.flat();
    const tl = gsap.timeline({
        delay: 2,
        paused: true,
        onUpdate: render,
        defaults: {
            ease: "power2.inOut" 
        },
        onComplete: () => {
        }
    });

    tl.to(camera.position, {
        z: paletteGroupCenter.z + 4000,
        x: paletteGroupCenter.x,
        y: paletteGroupCenter.y,
        duration: 2,
    })

    tl.to(camera.position, {
        z: "+=5000",
        x: sceneCenter.x,
        y: sceneCenter.y,
        duration: 2,
    }, "+=2")

    paletteDests.forEach((dests, paletteIdx) => {
        const srcMesh = flatPaletteMeshes[paletteIdx];
        let srcCenter = new THREE.Vector3();
        srcMesh.getWorldPosition(srcCenter);

        dests.forEach(([i, j]) => {
            const srcClone = srcMesh.clone();

            const dstMesh = numberMeshes[i][j];
            let dstCenter = new THREE.Vector3();
            dstMesh.getWorldPosition(dstCenter);

            scene.add(srcClone);
            gsap.set(srcClone.position, {
                x: srcCenter.x,
                y: srcCenter.y,
                z: srcCenter.z,
            });
            tl.to(srcClone.position, {
                x: dstCenter.x,
                y: dstCenter.y,
                z: dstCenter.z + camera.position.z / 100,
                duration: 0.05,
            },
                `palette${paletteIdx}Move`)
        });
    });
    tl.play();
}

window.addEventListener('load', function () {
    runAnimation();
})
