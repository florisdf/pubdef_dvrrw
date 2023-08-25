import { idxToNumber, getNumberTable, getColorTable, floatToGray } from '../lib/anims.js';
import * as THREE from '../lib/three.module.js';

function runAnimation() {
    const container = document.getElementById('container');
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = width/height;

    const [left, right, top, bottom] = [-width/2, width/2, height/2, -height/2];
    let camera = new THREE.OrthographicCamera(left, right, top, bottom, 0, 10000);
    camera.position.z = 100;

    const stepSize = 13;
    const maxValue = 100;
    const paletteTable = _.range(0, maxValue + 1, stepSize).map(x => _.range(x, Math.min(x + stepSize, maxValue + 1)).map(x => x/maxValue));
    const flatPalette = paletteTable.flat();

    const cellSize = height / 20;
    const colorIdxs = [
        [10, 90, 40],
        [100, 80, 30],
        [70, 10, 95],
    ];
    const numRows = colorIdxs.length;
    const numCols = Math.max(...colorIdxs.map(row => row.length));
    const numbers = idxToNumber(colorIdxs, flatPalette);

    const tableWidth = numCols * cellSize;
    const tableHeight = numRows * cellSize;

    let scene = new THREE.Scene();

    const {group: numberTable, meshes: numberMeshes} = getNumberTable(
        numbers, cellSize, cellSize*0.03, 0, 0, 2
    )
    scene.add(numberTable);

    const tableBox = new THREE.Box3();
    tableBox.setFromObject(numberTable);
    let tableCenter = new THREE.Vector3();
    tableBox.getCenter(tableCenter);
    let tableSize = new THREE.Vector3();
    tableBox.getSize(tableSize);

    // const colors = floatToGray(numbers);
    // const {group: colorTable, meshes: colorMeshes} = getColorTable(colors, cellSize)
    // colorTable.position.x = numberTable.position.x;
    // colorTable.position.y = numberTable.position.y + tableSize.y + 10;
    // scene.add(colorTable);

    const marginX = cellSize / 5;
    const marginY = cellSize + marginX;
    const {
        group: paletteColorGroup,
        meshes: paletteColorMeshes
    } = getColorTable(floatToGray(paletteTable), cellSize, 0, marginX, marginY, 'black')

    const paletteBox = new THREE.Box3();
    paletteBox.setFromObject(paletteColorGroup);
    let paletteSize = new THREE.Vector3();
    paletteBox.getSize(paletteSize);
    let paletteCenter = new THREE.Vector3();
    paletteBox.getCenter(paletteCenter);

    paletteColorGroup.position.x = numberTable.position.x - paletteSize.x - cellSize * 5;
    paletteColorGroup.position.y = numberTable.position.y + (paletteSize.y - tableSize.y) / 2;
    paletteColorGroup.position.z = numberTable.position.z;

    const {
        group: paletteNumberGroup,
        meshes: paletteNumberMeshes
    } = getNumberTable(paletteTable, cellSize, 0, marginX, marginY)
    paletteNumberGroup.position.x = paletteColorGroup.position.x;
    paletteNumberGroup.position.y = paletteColorGroup.position.y - cellSize;
    paletteNumberGroup.position.z = paletteColorGroup.position.z;

    const paletteGroup = new THREE.Group();
    paletteGroup.add(paletteColorGroup);
    paletteGroup.add(paletteNumberGroup);

    scene.add(paletteGroup);

    const sceneGroup = new THREE.Group();
    sceneGroup.add(numberTable);
    sceneGroup.add(paletteGroup);
    const sceneBox = new THREE.Box3();
    sceneBox.setFromObject(sceneGroup);
    const sceneSize = sceneBox.getSize(new THREE.Vector3());

    sceneGroup.x = width / 2;
    sceneGroup.y = height / 2;

    let renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio)
    const renderEl = renderer.domElement;
    renderEl.style.position = 'absolute';
    renderEl.style.top = 0;
    renderEl.style.left = 0;
    container.appendChild(renderEl);
    renderer.domElement.style.margin = "auto"
    renderer.setSize(width, height);

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
            tl.to(dstMesh.scale, {
                x: 1.2,
                y: 1.2,
                repeat: 1,
                yoyo: true,
                duration: 0.2,
            },
                `palette${paletteIdx}Scale`
            ).to(srcClone.position, {
                x: dstCenter.x,
                y: dstCenter.y,
                z: dstCenter.z + (paletteIdx + 1)/100,
                duration: 1,
            },
                `palette${paletteIdx}Move`)
        });
    });
    tl.play();
}

window.addEventListener('load', function () {
    runAnimation();
})
