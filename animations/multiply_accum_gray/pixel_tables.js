import { getObjectSize } from '../image_palette/image_palette.js';
import * as THREE from 'three';


export function getTable({
    cells, cellToMesh, cellSize,
    cellMarginX=0, cellMarginY=cellMarginX
}) {
    const numRows = cells.length;
    const numCols = Math.max(...cells.map(row => row.length));

    const group = new THREE.Group();

    let i, j;
    for (i = 0; i < numRows; i++) {
        const row = cells[i];
        for (j = 0; j < numCols; j++) {
            if (row.length <= j) {
                continue;
            }
            const cell = cells[i][j];
            const mesh = cellToMesh(cell);
            mesh.position.x = j*(cellSize + cellMarginX);
            mesh.position.y = - i*(cellSize + cellMarginY);
            mesh.position.z = 0;
            group.add(mesh);
        }
    }

    return group;
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
    const geometry = new THREE.PlaneGeometry(size, size);
    geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(size/2, -size/2, 0));

    const mesh = new THREE.Mesh(geometry, material)
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
    fontColor='black', fillColor=null,
    fontFamily='Quicksand',
    fontWeight='500',
    bgColor=null,
}) {
    return getTextMesh({
        text,
        width: size, height: size,
        strokeWidth, strokeColor, fontSize, fontColor,
        fillColor, fontFamily, fontWeight,
        bgColor,
    });
};

export function getTextMesh({
    text, width=null, height, strokeWidth=3,
    strokeColor='black', fontColor='black',
    fontSize=`${height*.4}px`,
    fillColor=null,
    fontFamily='Quicksand',
    fontWeight='500',
    bgColor=null,
}) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const font = `${fontWeight} ${fontSize} ${fontFamily}`;

    if (width === null) {
        ctx.font = font;
        const textMetrics = ctx.measureText(text);
        width = textMetrics.width;
    }

    const scale = window.devicePixelRatio;
    ctx.scale(scale, scale);
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);

    ctx.font = font;
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    if (bgColor !== null) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
    }
    if (fillColor !== null) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, 0, width, height);
    }
    ctx.fillStyle = fontColor;
    ctx.fillText(text, width / 2, height / 2)
    if (strokeWidth > 0) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = strokeColor;
        ctx.strokeRect(0, 0, width, height)
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
    })
    const geometry = new THREE.PlaneGeometry(width, height);
    geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(width/2, -height/2, 0));
    const mesh = new THREE.Mesh(geometry, material)
    return mesh
}


export function getColoredNumberTable({
    numbers, numberToColor, cellSize, strokeWidth,
    cellMarginX=0,
    cellMarginY=cellMarginX,
    precision=2,
    fontColor='black',
    strokeColor='black',
    fontSize=`${cellSize*.4}px`,
    bgColor='white',
}) {
    return getTable({
        cells: numbers,
        cellToMesh: cell => {
            const fillColor = numberToColor(cell);
            const x = cell.toFixed(precision)
            return getSquareTextMesh({
                text: `${x}`, size: cellSize, strokeWidth, strokeColor,
                fontColor, fontSize, fillColor, bgColor
            });
        },
        cellSize, cellMarginX, cellMarginY
    });
}


export function getMultiChannelColoredNumberTable({
    numbers, numberToColor, cellSize, strokeWidth,
    cellMarginX=0,
    cellMarginY=cellMarginX,
    channelMargin=100,
    precision=2,
    fontColor='black',
    strokeColor='black',
    fontSize=`${cellSize*.4}px`,
    bgColor='white',
}) {
    const rgbTableGroup = new THREE.Group();
    const channelTables = numbers.map((channel, i) => {
        const group = getTable({
            cells: channel,
            cellToMesh: cell => {
                const fillColor = numberToColor(cell, i);
                const x = cell.toFixed(precision)
                return getSquareTextMesh({
                    text: `${x}`, size: cellSize, strokeWidth, strokeColor,
                    fontSize, fontColor, fillColor, bgColor
                });
            },
            cellSize, cellMarginX, cellMarginY
        });
        const tableSize = getObjectSize(group);
        const shiftX = tableSize.x + channelMargin;
        group.position.x = [0, shiftX, 2*shiftX][i];
        rgbTableGroup.add(group);
    });
    return rgbTableGroup;
}
