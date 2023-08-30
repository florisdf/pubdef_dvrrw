import { getObjectSize } from '../image_palette/image_palette.js';
import * as THREE from 'three';


export class Table {
    #cells;
    #cellMarginX;
    #cellMarginY;
    #size;
    #group;
    #meshes;
    #numRows;
    #numCols;
    constructor({
        cells, cellMarginX=0, cellMarginY=cellMarginX
    }) {
        this.#cells = cells;
        this.#cellMarginX = cellMarginX;
        this.#cellMarginY = cellMarginY;

        this.#numRows = cells.length;
        this.#numCols = Math.max(...cells.map(row => row.length));

        this.#group = new THREE.Group();
        this.updateAll();
    }
    updateAll() {
        this.#group.clear();
        let i, j;
        let totalWidth = 0;
        let totalHeight = 0;
        for (i = 0; i < this.#numRows; i++) {
            const row = this.#cells[i];
            for (j = 0; j < this.#numCols; j++) {
                if (row.length <= j) {
                    continue;
                }
                const cell = this.#cells[i][j];
                cell.group.name = `${i},${j}`;
                cell.group.position.x = j*(cell.width + this.#cellMarginX);
                cell.group.position.y = - i*(cell.height + this.#cellMarginY);
                cell.group.position.z = 0;
                this.#group.add(cell.group);
            }
        }
        this.#size = new THREE.Box3().setFromObject(this.#group).getSize(new THREE.Vector3());
    }
    get group() {
        return this.#group;
    }
    get size() {
        return this.#size;
    }
}


function setHexOpacity(hexColorString, opacity) {
    return `${hexColorString.substr(0, 7)}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
}

export class TableCell {
    #text;
    #width;
    #height;

    #style;

    #canvasTexture;
    #canvas;
    #canvasCtx;

    constructor ({
        text, width=null, height, strokeWidth=3,
        strokeColor='black', fontColor='black',
        fontSize=`${height*.4}px`,
        fillColor=null,
        fillOpacity=1.0,
        fontFamily='Quicksand',
        fontWeight='500',
        fontOpacity=1.0,
        bgColor=null,
    }) {
        this.#text = text;
        this.#width = width;
        this.#height = height;

        this.#style = {
            strokeWidth,
            strokeColor,
            fontColor,
            fontOpacity,
            fontSize,
            fontFamily,
            fontWeight,
            fillColor,
            fillOpacity,
            bgColor,
        };

        this.#canvas = document.createElement("canvas");
        this.#canvasTexture = new THREE.CanvasTexture(this.#canvas);
        this.#canvasCtx = this.#canvas.getContext("2d");

        if (width === null) {
            this.#canvasCtx.font = this.font;
            const textMetrics = this.#canvasCtx.measureText(text);
            this.#width = textMetrics.width;
        }

        this.#canvas.width = this.#width;
        this.#canvas.height = this.#height;

        this.drawCanvas()

        const material = new THREE.MeshBasicMaterial({
            map: this.#canvasTexture,
            transparent: true,
            side: THREE.DoubleSide,
            blending: fillColor !== null ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthWrite: false,
        })
        const geometry = new THREE.PlaneGeometry(this.#width, this.#height);
        geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(this.#width/2, -height/2, 0));
        const textMesh = new THREE.Mesh(geometry, material)
        textMesh.name = 'textMesh';

        const group = new THREE.Group();

        if (fillColor !== null) {
            const blackMaterial = new THREE.MeshBasicMaterial({
                color: 'black',
                side: THREE.DoubleSide,
            });
            const blackGeometry = geometry.clone();
            blackGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -2));
            const blackMesh = new THREE.Mesh(blackGeometry, blackMaterial)
            group.add(blackMesh);
        }
        group.add(textMesh);

        this.group = group;
    }

    drawCanvas() {
        const {
            strokeWidth, strokeColor,
            fontColor, fontOpacity, fontSize,
            fontFamily, fontWeight,
            fillColor, fillOpacity,
            bgColor,
        } = this.#style;
        this.#canvasCtx.font = this.font;
        this.#canvasCtx.textAlign = 'center'
        this.#canvasCtx.textBaseline = 'middle'

        if (bgColor !== null) {
            this.#canvasCtx.fillStyle = bgColor;
            this.#canvasCtx.fillRect(0, 0, this.#width, this.#height);
        }
        if (fillColor !== null) {
            this.#canvasCtx.fillStyle = fillColor;
            // Canvas automatically converts to hex
            this.#canvasCtx.fillStyle = setHexOpacity(this.#canvasCtx.fillStyle, fillOpacity); 
            this.#canvasCtx.fillRect(0, 0, this.#width, this.#height);
        }
        this.#canvasCtx.fillStyle = fontColor;
        this.#canvasCtx.fillStyle = setHexOpacity(this.#canvasCtx.fillStyle, fontOpacity); 
        this.#canvasCtx.fillText(this.#text, this.#width / 2, this.#height / 2)
        if (strokeWidth > 0) {
            this.#canvasCtx.lineWidth = strokeWidth;
            this.#canvasCtx.strokeStyle = strokeColor;
            this.#canvasCtx.strokeRect(0, 0, this.#width, this.#height)
        }

        this.#canvasTexture.needsUpdate = true;
    }

    get font() {
        const {fontSize, fontFamily, fontWeight} = this.#style;
        return `${fontWeight} ${fontSize} ${fontFamily}`;
    }
    get width() {
        return this.#width;
    }
    get height() {
        return this.#height;
    }
    get text() {
        return this.#text;
    }

    get style() {
        return this.#style;
    }
    set style(style) {
        this.#style = style;
        this.drawCanvas();
    }
    updateStyle(style) {
        this.style = {...this.#style, ...style};
    }
}


export class PixelTable {
    #tables;
    #values;
    #valueToColor;
    #precision;

    #cellSize;
    #cellStyle;

    #cellMarginX;
    #cellMarginY;
    #channelMargin;
    #size;

    #group;
    #cells;
    constructor ({
        values, valueToColor,
        cellSize, strokeWidth,
        cellMarginX=0,
        cellMarginY=cellMarginX,
        channelMargin=100,
        precision=2,
        fillOpacity=1.0,
        fontColor='black',
        fontOpacity=1.0,
        strokeColor='black',
        fontSize=`${cellSize*.4}px`,
        bgColor='white',
    }) {
        this.#values = values;
        this.#valueToColor = valueToColor;
        this.#precision = precision;
        this.#cellSize = cellSize;
        this.#cellStyle = {
            fillOpacity,
            strokeWidth,
            strokeColor,
            fontColor,
            fontOpacity,
            fontSize,
            bgColor,
        }
        this.#cellMarginX = cellMarginX;
        this.#cellMarginY = cellMarginY;
        this.#channelMargin = channelMargin;

        this.#group  = new THREE.Group();
        this.createTables();

        this.#tables.forEach((table, i) => {
            table.group.name = `channel${i}`;
            this.#group.add(table.group);
        })

        this.positionTables();
    }

    createTables() {
        this.#cells = this.#values.map((channelVals, i) =>
            channelVals.map((rowVals, j) =>
                rowVals.map((val, k) =>
                    new TableCell({
                        text: `${val.toFixed(this.#precision)}`,
                        width: this.#cellSize,
                        height: this.#cellSize,
                        ...this.#cellStyle,
                        fillColor: this.#valueToColor(this.#values[i][j][k], i),
                    })
                )
            )
        );
        this.#tables = this.#cells.map((channelCells, c) =>
            new Table({
                cells: channelCells,
                cellMarginX: this.#cellMarginX,
                cellMarginY: this.#cellMarginY,
            })
        );
    }

    positionTables() {
        let shiftX = 0;
        this.#tables.forEach(table => {
            table.group.position.x = shiftX;
            shiftX += table.size.x + this.#channelMargin;
        });
        this.#size = new THREE.Box3().setFromObject(this.group).getSize(new THREE.Vector3())
    }

    get cellSize() {
        return this.#cellSize;
    }

    get group() {
        return this.#group;
    }

    get channelMargin() {
        return this.#channelMargin;
    }
    set channelMargin(channelMargin) {
        this.#channelMargin = channelMargin;
        this.positionTables();
    }

    get size() {
        return this.#size;
    }

    get cellStyle() {
        return this.#cellStyle;
    }
    set cellStyle(cellStyle) {
        this.#cellStyle = cellStyle;
        this.#cells.forEach((channelCells, i) =>
            channelCells.map((rowCells, j) =>
                rowCells.map((cell, k) =>
                    cell.updateStyle({
                        ...this.#cellStyle,
                    })
                )
            )
        );
    }
    updateCellStyle(cellStyle) {
        this.cellStyle = {...this.#cellStyle, ...cellStyle};
    }
}
