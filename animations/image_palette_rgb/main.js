import {
    idxToNumber, getNumberTable, getColorTable, getObjectCenter, getObjectSize,
    floatToRed, floatToGreen, floatToBlue,
} from '../lib/anims.js';
import * as THREE from '../lib/three.module.js';
import waldek_red from './waldek_the_red.js';
import waldek_green from './waldek_the_green.js';
import waldek_blue from './waldek_the_blue.js';


function getNumberTableWithPalette(idxTable, paletteTable, floatToColor) {
    const cellSize = 100;

    const numbers = idxToNumber(idxTable, paletteTable.flat());
    const {group: numberTableGroup, meshes: numberTableMeshes} = getNumberTable(
        numbers, cellSize, 3, 0, 0, 2
    )
    const tableSize = getObjectSize(numberTableGroup);

    const paletteCellSize = 2 * cellSize;
    const marginX = paletteCellSize / 5;
    const marginY = paletteCellSize + marginX;
    const {
        group: paletteColorGroup,
        meshes: paletteColorMeshes
    } = getColorTable(floatToColor(paletteTable), paletteCellSize, 0, marginX, marginY, 'black')

    const paletteSize = getObjectSize(paletteColorGroup);

    paletteColorGroup.position.x = numberTableGroup.position.x - paletteSize.x - tableSize.x/2;
    paletteColorGroup.position.y = numberTableGroup.position.y + (paletteSize.y - tableSize.y) / 2;
    paletteColorGroup.position.z = numberTableGroup.position.z;

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

    const sceneGroup = new THREE.Group();
    sceneGroup.add(numberTableGroup);
    sceneGroup.add(paletteGroup);

    return {
        idxTable: idxTable,
        sceneGroup: sceneGroup,
        numberTableGroup: numberTableGroup,
        numberTableMeshes: numberTableMeshes,
        paletteGroup: paletteGroup,
        paletteNumberGroup: paletteNumberGroup,
        paletteNumberMeshes: paletteNumberMeshes,
        paletteColorGroup: paletteColorGroup,
        paletteColorMeshes: paletteColorMeshes,
    }
}


function getAnimationTimeline(sceneCompsRed, sceneCompsGreen, sceneCompsBlue) {
    const scene = new THREE.Scene();

    const {sceneGroup: sceneGroupRed} = sceneCompsRed;
    const {sceneGroup: sceneGroupGreen} = sceneCompsGreen;
    const {sceneGroup: sceneGroupBlue} = sceneCompsBlue;

    const sceneRedSize = getObjectSize(sceneGroupRed);

    const sceneMargin = sceneRedSize.y / 2;
    const sceneShiftY = sceneRedSize.y + sceneMargin;
    sceneGroupGreen.position.y -= sceneShiftY;
    sceneGroupBlue.position.y -= 2*sceneShiftY

    scene.add(sceneGroupRed);
    scene.add(sceneGroupGreen);
    scene.add(sceneGroupBlue);

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    const fov = 45;
    const camera = new THREE.PerspectiveCamera(fov, canvasWidth/canvasHeight, 1, 100000);

    const sceneCenterRed = getObjectCenter(sceneGroupRed);

    camera.position.z = sceneCenterRed.z + 9000;
    camera.position.x = sceneCenterRed.x;
    camera.position.y = sceneCenterRed.y;

    const container = document.getElementById('container');

    const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio)
    const renderEl = renderer.domElement;
    container.appendChild(renderEl);
    renderer.setSize(canvasWidth, canvasHeight);
    function render() {
        renderer.render(scene, camera);
    }
    render()

    const tl = gsap.timeline({
        delay: 0.5,
        paused: true,
        onUpdate: render,
        defaults: {
            ease: "power2.inOut" 
        },
    });

    const allSceneComps = [sceneCompsRed, sceneCompsGreen, sceneCompsBlue];
    const meshCloneGroups = [];
    allSceneComps.forEach((sceneComps, i, arr) =>  {
        const {tl: tlSub, meshCloneGroup} = animatePaletteToTable({
            scene: scene,
            ...sceneComps
        });
        if (i < arr.length - 1) {
            tlSub.to(camera.position, {
                y: `-=${sceneShiftY}`,
            })
        }
        meshCloneGroups.push(meshCloneGroup);
        tl.add(tlSub);
    });

    const sceneCenterGreen = getObjectCenter(sceneGroupGreen);

    tl.to(camera.position, {
        x: sceneCenterGreen.x,
        y: sceneCenterGreen.y,
        z: "+=20000",
        onStart: () => {
            allSceneComps.forEach(({numberTableGroup, paletteColorMeshes}, i) =>  {
                numberTableGroup.removeFromParent();
                paletteColorMeshes.flat().forEach(mesh => {
                    mesh.material.blending = THREE.AdditiveBlending;
                });
            });
        },
    })

    tl.to(
        meshCloneGroups[0].position, {
            y: `-=${sceneShiftY}`,
            duration: 2,
        }, 'meshOverlap'
    ).to(
        meshCloneGroups[2].position, {
            y: `+=${sceneShiftY}`,
            duration: 2,
        }, 'meshOverlap'
    )

    return tl;
}


function animatePaletteToTable({scene, idxTable, paletteColorMeshes, numberTableMeshes}) {
    const tl = gsap.timeline({
        defaults: {
            ease: "power2.inOut" 
        },
    });

    const paletteDests = paletteColorMeshes.flat().map(() => []);
    idxTable.forEach((row, i) => {
        row.forEach((paletteIdx, j) => {
            paletteDests[paletteIdx].push([i, j]);
        });
    });

    const flatPaletteMeshes = paletteColorMeshes.flat();
    const meshCloneGroup = new THREE.Group();

    paletteDests.forEach((dests, paletteIdx) => {
        const srcMesh = flatPaletteMeshes[paletteIdx];
        let srcCenter = new THREE.Vector3();
        srcMesh.getWorldPosition(srcCenter);
        const srcSize = getObjectSize(srcMesh);

        dests.forEach(([i, j]) => {
            const srcClone = srcMesh.clone();

            const dstMesh = numberTableMeshes[i][j];
            let dstCenter = new THREE.Vector3();
            dstMesh.getWorldPosition(dstCenter);
            const dstSize = getObjectSize(dstMesh);

            meshCloneGroup.add(srcClone);
            gsap.set(srcClone.position, {
                x: srcCenter.x,
                y: srcCenter.y,
                z: srcCenter.z,
            });
            tl.to(srcClone.position, {
                x: dstCenter.x,
                y: dstCenter.y,
                z: dstCenter.z + 10,
                duration: 1,
            }, 'paletteMove'
            ).to(srcClone.scale, {
                x: dstSize.x / srcSize.x,
                y: dstSize.y / srcSize.y,
            }, 'paletteMove')
        });
    });
    scene.add(meshCloneGroup);
    return {tl, meshCloneGroup: meshCloneGroup};
}


function main() {
    const stepSize = 15;
    const maxValue = 100;
    const paletteTable = _.range(0, maxValue + 1, stepSize).map(x => _.range(x, Math.min(x + stepSize, maxValue + 1)).map(x => x/maxValue));

    const sceneCompsRed = getNumberTableWithPalette(waldek_red, paletteTable, floatToRed)
    const sceneCompsGreen = getNumberTableWithPalette(waldek_green, paletteTable, floatToGreen)
    const sceneCompsBlue = getNumberTableWithPalette(waldek_blue, paletteTable, floatToBlue)

    const tl = getAnimationTimeline(sceneCompsRed, sceneCompsGreen, sceneCompsBlue);
    tl.play();
}

window.addEventListener('load', function () {
    main();
})
