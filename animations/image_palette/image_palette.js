import * as THREE from '../lib/three.module.js';


export function getSquareTextMesh(
    text, size, fontSize='20pt', strokeWidth=3,
    strokeColor='black', fillColor='white',
    fontFamily='Quicksand'
) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const scale = window.devicePixelRatio;
    canvas.width = Math.floor(size * scale);
    canvas.height = Math.floor(size * scale);
    ctx.scale(scale, scale);

    ctx.font = `${fontSize} ${fontFamily}`;
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = strokeColor;
    ctx.fillText(text, size / 2, size / 2)
    if (strokeWidth > 0) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = strokeColor;
        ctx.strokeRect(0, 0, size, size)
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true

    var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
    })
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material)
    return mesh
}


export function getTable(
    cells, cellToMesh, cellSize, cellMarginX=0, cellMarginY=cellMarginX
) {
    const numRows = cells.length;
    const numCols = Math.max(...cells.map(row => row.length));

    const group = new THREE.Group();
    const cellMeshes = [];

    let i, j;
    for (i = 0; i < numRows; i++) {
        const row = cells[i];
        cellMeshes.push([])
        for (j = 0; j < numCols; j++) {
            if (row.length <= j) {
                continue;
            }
            const cell = cells[i][j];
            const mesh = cellToMesh(cell);
            mesh.position.x = j*(cellSize + cellMarginX) + cellSize/2;
            mesh.position.y = - i*(cellSize + cellMarginY) - cellSize/2;
            mesh.position.z = 0;
            group.add(mesh);
            cellMeshes[i].push(mesh);
        }
    }

    return {
        group: group,
        meshes: cellMeshes
    };
}

export function getNumberTable(
    numbers, cellSize, strokeWidth,
    cellMarginX=0,
    cellMarginY=cellMarginX,
    precision=2,
    strokeColor='black',
    fontSize=`${cellSize*.4}px`,
) {
    return getTable(
        numbers,
        cell => {
            const x = cell.toFixed(precision)
            return getSquareTextMesh(
                `${x}`, cellSize, fontSize,
                strokeWidth, strokeColor
            );
        },
        cellSize, cellMarginX, cellMarginY
    );
}


export function getColorSquare(
    fillColor, size, strokeWidth=0, strokeColor='black',
) {
    let material;
    if (strokeWidth > 0) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const scale = window.devicePixelRatio;
        canvas.width = Math.floor(size * scale);
        canvas.height = Math.floor(size * scale);
        ctx.scale(scale, scale);
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, 0, size, size)
        if (strokeWidth > 0) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.strokeRect(0, 0, size, size)
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true

        material = new THREE.MeshBasicMaterial({
            map: texture,
        })
    } else {
        material = new THREE.MeshBasicMaterial({
            color: fillColor,
        })
    }
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material)

    return mesh;
}


export function getColorTable(
    colors, cellSize, strokeWidth=0, cellMarginX=0, cellMarginY=cellMarginX,
    strokeColor='black'
) {
    return getTable(
        colors,
        cell => getColorSquare(cell, cellSize, strokeWidth, strokeColor),
        cellSize,
        cellMarginX,
        cellMarginY,
    );
}


const uInt = x => Math.round(x*255);
export const floatToGray = (arr) => arr.map(row => row.map(x => `rgb(${uInt(x)},${uInt(x)},${uInt(x)})`))
export const floatToRed = (arr) => arr.map(row => row.map(x => `rgb(${uInt(x)},${0},${0})`))
export const floatToGreen = (arr) => arr.map(row => row.map(x => `rgb(${0},${uInt(x)},${0})`))
export const floatToBlue = (arr) => arr.map(row => row.map(x => `rgb(${0},${0},${uInt(x)})`))

export const idxToNumber = (idxs, palette) => idxs.map(row => row.map(idx => palette[idx]))


export function getObjectCenter(obj) {
    const objBox = new THREE.Box3();
    objBox.setFromObject(obj);
    let objCenter = new THREE.Vector3();
    objBox.getCenter(objCenter);
    return objCenter;
}


export function getObjectSize(obj) {
    const objBox = new THREE.Box3();
    objBox.setFromObject(obj);
    let objSize = new THREE.Vector3();
    objBox.getSize(objSize);
    return objSize;
}

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
                z: srcCenter.z + 10,
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
