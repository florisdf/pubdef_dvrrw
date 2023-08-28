import * as THREE from 'three';


export function getTable({
    cells, cellToMesh, cellSize,
    cellMarginX=0, cellMarginY=cellMarginX
}) {
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


export function getColorSquare({
    fillColor, size, strokeWidth=0, strokeColor='black',
}) {
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
            transparent: true,
        })
    } else {
        material = new THREE.MeshBasicMaterial({
            color: fillColor,
            transparent: true,
        })
    }
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material)

    return mesh;
}


export function getColorTable({
    colors, cellSize, strokeWidth=0, cellMarginX=0, cellMarginY=cellMarginX,
    strokeColor='black'
}) {
    return getTable({
        cells: colors,
        cellToMesh: cell => getColorSquare({
            fillColor: cell, size: cellSize, strokeWidth, strokeColor
        }),
        cellSize,
        cellMarginX,
        cellMarginY,
    });
}


export function getSquareTextMesh({
    text, size, strokeWidth=3,
    strokeColor='black', fontSize=`${size*.4}px`,
    fillColor=null,
    fontFamily='Quicksand'
}) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const scale = window.devicePixelRatio;
    canvas.width = Math.floor(size * scale);
    canvas.height = Math.floor(size * scale);
    ctx.scale(scale, scale);

    if (fillColor !== null) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, 0, size, size);
    }
    ctx.font = `${fontSize} ${fontFamily}`;
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
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


export function getColoredNumberTable({
    numbers, numberToColor, cellSize, strokeWidth,
    cellMarginX=0,
    cellMarginY=cellMarginX,
    precision=2,
    strokeColor='black',
    fontSize=`${cellSize*.4}px`,
}) {
    return getTable({
        cells: numbers,
        cellToMesh: cell => {
            const fillColor = numberToColor(cell);
            const x = cell.toFixed(precision)
            return getSquareTextMesh({
                text: `${x}`, size: cellSize, strokeWidth, strokeColor,
                fontSize, fillColor,
            });
        },
        cellSize, cellMarginX, cellMarginY
    });
}
