import {
    idxToNumber, getNumberTable, getColorTable, getObjectSize,
} from '../lib/anims.js';
import * as THREE from '../lib/three.module.js';


export function getNumberTableWithPalette(idxTable, paletteTable, floatToColor) {
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


export function animatePaletteToTable({
    scene, idxTable, paletteColorMeshes, numberTableMeshes,
    simultaneous = true, pixelFlyDuration = simultaneous ? 1 : 0.1,
}) {
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

            const label = `paletteMove${simultaneous ? '' : paletteIdx}`;

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
                duration: pixelFlyDuration,
            }, label
            ).to(srcClone.scale, {
                x: dstSize.x / srcSize.x,
                y: dstSize.y / srcSize.y,
                duration: pixelFlyDuration
            }, label)
        });
    });
    scene.add(meshCloneGroup);
    return {tl, meshCloneGroup: meshCloneGroup};
}
