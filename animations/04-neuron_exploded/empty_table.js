import * as THREE from 'three';

import { setOpacity } from '../03a-multiply_accum_rgb/pixel_tables.js';


export class EmptyTable {
    #strokeWidth
    #strokeColor
    #fillColor
    #numRows
    #numCols
    #depth
    #depthColor
    #cellSize
    #opacity
    constructor({
        strokeColor = 'black',
        fillColor = 'white',
        depthColor = strokeColor,
        numRows,
        numCols=numRows,
        cellSize,
        strokeWidth = cellSize / 10,
        depth = cellSize / 10,
        opacity = 1.0,
    }) {
        this.#strokeWidth = strokeWidth
        this.#strokeColor = strokeColor
        this.#depthColor = depthColor
        this.#fillColor   = fillColor
        this.#numRows     = numRows
        this.#numCols     = numCols
        this.#depth       = depth
        this.#cellSize    = cellSize
        this.#opacity     = opacity;

        this.group = new THREE.Group();

        this.canvas = document.createElement("canvas");
        this.canvasTexture = new THREE.CanvasTexture(this.canvas);
        this.canvasCtx = this.canvas.getContext("2d");

        const group = new THREE.Group();
        this.group = group;

        this.draw()
    }

    draw() {
        this.drawCanvas()
        this.drawBox()
    }

    drawBox() {
        this.group.clear();
        const geometry = new THREE.BoxGeometry(this.width, this.height, this.#depth);
        geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(this.width/2, -this.height/2, -this.#depth/2));
        this.frontBackMaterial = new THREE.MeshBasicMaterial({
            map: this.canvasTexture,
            transparent: true,
        })
        this.colorMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(this.#depthColor),
            transparent: true,
        });
        const mesh = new THREE.Mesh(geometry, [
            this.colorMaterial,       // Right side
            this.colorMaterial,       // Left side
            this.colorMaterial,       // Top side
            this.colorMaterial,       // Bottom side
            this.frontBackMaterial,   // Front side
            this.frontBackMaterial    // Back side
        ]);
        this.group.add(mesh);
    }

    get width() {
        return this.cellSize * this.numCols + this.#strokeWidth;
    }
    get height() {
        return this.cellSize * this.numRows + this.#strokeWidth;
    }
    get cellSize() {
        return this.#cellSize;
    }

    get numCols() {
        return this.#numCols;
    }
    set numCols(numCols) {
        this.#numCols = Math.round(numCols);
        this.draw();
    }

    get numRows() {
        return this.#numRows;
    }
    set numRows(numRows) {
        this.#numRows = Math.round(numRows);
        this.draw();
    }

    get opacity() {
        return this.#opacity;
    }
    set opacity(opacity) {
        this.#opacity = opacity;
        this.frontBackMaterial.opacity = opacity;
        this.colorMaterial.opacity = opacity;
    }

    drawCanvas() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvasCtx.fillStyle = this.#fillColor;
        this.canvasCtx.fillRect(0, 0, this.width, this.height);

        this.canvasCtx.lineWidth = this.#strokeWidth;
        this.canvasCtx.strokeStyle = this.#strokeColor;
        _.range(this.#numCols + 1).map(col => {
            this.canvasCtx.beginPath(); 
            const x = col * this.cellSize + this.#strokeWidth/2;
            this.canvasCtx.moveTo(x, 0);
            this.canvasCtx.lineTo(x, this.height);
            this.canvasCtx.stroke();
        })

        _.range(this.#numRows + 1).map(row => {
            this.canvasCtx.beginPath(); 
            const y = row * this.cellSize + this.#strokeWidth/2;
            this.canvasCtx.moveTo(0, y);
            this.canvasCtx.lineTo(this.width, y);
            this.canvasCtx.stroke();
        })

        this.canvasTexture.needsUpdate = true;
    }
}
