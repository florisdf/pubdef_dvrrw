import * as THREE from 'three';


function setHexOpacity(hexColorString, opacity) {
    return `${hexColorString.substr(0, 7)}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
}


export class PixelTable {
    #tables;
    #values;
    #colors;
    #precision;

    #cellSize;
    #cellStyle;
    #size;

    #group;
    #cells;

    #numPixelsShown;

    #channelDepth;
    #channelMargin;
    constructor ({
        values, colors,
        cellSize, 
        numPixelsShown = null,
        strokeWidth=0,
        channelToColor=(ch, numCh) => `hsl(${ch*360/numCh}, 100%, ${numCh === 1 ? 100 : 50}%)`,
        channelDepth=cellSize,
        channelMargin=0,
        precision=2,
        fillOpacity=1.0,
        fontColor='black',
        fontOpacity=1.0,
        strokeColor='black',
        fontSize=`${cellSize*.4}px`,
        bgColor='white',
    }) {
        this.#values = values;
        this.#colors = colors;
        this.#precision = precision;
        this.#cellSize = cellSize;
        this.#channelDepth = channelDepth;
        this.#cellStyle = {
            fillOpacity,
            strokeWidth,
            strokeColor,
            fontColor,
            fontOpacity,
            fontSize,
            bgColor,
        }
        this.#numPixelsShown = numPixelsShown === null ? this.numCols * this.numRows : numPixelsShown;
        this.#channelMargin = channelMargin;

        this.channelToColor = channelToColor;

        this.#group = new THREE.Group();

        this.createTables();

        this.#tables.forEach(table => this.#group.add(table));
    }

    createTables() {
        this.#tables = _.range(this.numChannels).map(() => new THREE.Group());
        this.incomplChannelMeshes = [];
        this.complChannelMeshes = [];
        this.updateIncomplGroup();
        this.updateComplGroup();
    }

    updateIncomplGroup() {
        this.incomplChannelMeshes.forEach(mesh => mesh.removeFromParent());

        this.incomplChannelMeshes = [];

        if (this.numIncompleteRows > 0) {
            const numIncompletePixels = this.#numPixelsShown % this.numCols;
            const incomplValues = sliceChannels(
                this.#values, this.numCompleteRows, this.numCompleteRows + 1, 0, numIncompletePixels
            );
            const incomplColors = sliceChannels(
                this.#colors, this.numCompleteRows, this.numCompleteRows + 1, 0, numIncompletePixels
            );
            this.incomplChannelMeshes = getChannelMeshes({
                colors: incomplColors, values: incomplValues,
                cellSize: this.#cellSize,
                channelDepth: this.#channelDepth,
                channelToColor: this.channelToColor,
                channelMargin: this.#channelMargin,
                ...this.#cellStyle,
            });
            this.incomplChannelMeshes.forEach((channelMesh, i) => {
                this.#tables[i].add(channelMesh);
                channelMesh.position.y = - this.numCompleteRows * this.cellSize;
            });
        }
    }

    updateComplGroup() {
        this.complChannelMeshes.forEach(mesh => mesh.removeFromParent());

        this.complChannelMeshes = [];

        if (this.numCompleteRows > 0) {
            const complValues = sliceChannels(
                this.#values, 0, this.numCompleteRows, 0, this.numCols
            );
            const complColors = sliceChannels(
                this.#colors, 0, this.numCompleteRows, 0, this.numCols
            );
            this.complChannelMeshes = getChannelMeshes({
                colors: complColors, values: complValues,
                cellSize: this.#cellSize,
                channelDepth: this.#channelDepth,
                channelToColor: this.channelToColor,
                channelMargin: this.#channelMargin,
                ...this.#cellStyle,
            });
            this.complChannelMeshes.forEach((mesh, i) => {
                this.#tables[i].add(mesh);
            });
        }
    }

    get numChannels() {
        return this.#values.length;
    }
    get numRows() {
        return this.#values[0].length;
    }
    get numCols() {
        return this.#values[0][0].length;
    }

    get numCompleteRows() {
        return Math.floor(this.numPixelsShown / this.numCols);
    }
    get numIncompleteRows() {
        return this.numPixelsShown % this.numCols === 0 ? 0 : 1;
    }

    get numPixelsShown() {
        return this.#numPixelsShown;
    }

    set numPixelsShown(numPixelsShown) {
        numPixelsShown = Math.round(numPixelsShown);

        const doUpdate = numPixelsShown !== this.#numPixelsShown;
        this.#numPixelsShown = numPixelsShown;

        if (doUpdate) {
            this.updateComplGroup();
            this.updateIncomplGroup();
        }
    }

    get cellSize() {
        return this.#cellSize;
    }

    get group() {
        return this.#group;
    }

    get size() {
        return this.#size;
    }
}


function getChannelMeshes({
    colors, values, cellSize = 10,
    channelToColor,
    channelDepth=cellSize,
    channelMargin=0,
    strokeWidth=0,
    strokeColor='black',
    fontColor='black',
    fontSize=`${cellSize*.4}px`,
    fillOpacity=0.5,
    fontFamily='Quicksand',
    fontWeight='500',
    fontOpacity=1.0,
    bgColor='white',
}) {
    const numChannels = values.length;
    return _.range(numChannels).map(i => {
        const canvas = document.createElement('canvas');

        drawImageOnCanvas({
            canvas, colors: colors[i], values: values[i],
            cellSize,
            strokeWidth,
            strokeColor,
            fontColor,
            fontSize,
            fillOpacity,
            fontFamily,
            fontWeight,
            fontOpacity,
            bgColor,
        })

        const geometry = new THREE.BoxGeometry(canvas.width, canvas.height, channelDepth);
        geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(new THREE.Vector3(canvas.width/2, -canvas.height/2, - channelDepth/2)));

        const texture = new THREE.CanvasTexture(canvas);
        const frontBackMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });

        const colorMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(channelToColor(i, numChannels)),
        });
        const mesh = new THREE.Mesh(geometry, [
            colorMaterial,       // Right side
            colorMaterial,       // Left side
            colorMaterial,       // Top side
            colorMaterial,       // Bottom side
            frontBackMaterial,   // Front side
            frontBackMaterial    // Back side
        ]);
        mesh.position.z = - i * (channelDepth + channelMargin);
        return mesh;
    });
}


function drawImageOnCanvas({
    canvas,
    colors, values, cellSize = 10,
    strokeWidth=0,
    strokeColor='black',
    fontColor='black',
    fontSize=`${cellSize*.4}px`,
    fillOpacity=0.5,
    fontFamily='Quicksand',
    fontWeight='500',
    fontOpacity=1.0,
    bgColor='white',
}) {
    const imWidth = colors[0].length;
    const imHeight = colors.length;
    const width = cellSize * imWidth;
    const height = cellSize * imHeight;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    colors.forEach((row, i) => row.forEach((color, j) => {
        const [x1, y1, x2, y2] = [
            j*cellSize, i*cellSize, (j + 1)*cellSize, (i + 1)*cellSize
        ];

        if (bgColor !== null) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(x1, y1, x2, y2);
        }

        ctx.fillStyle = color;
        // Canvas automatically converts to hex
        ctx.fillStyle = setHexOpacity(ctx.fillStyle, fillOpacity); 
        ctx.fillRect(x1, y1, x2, y2);

        ctx.fillStyle = fontColor;
        ctx.fillStyle = setHexOpacity(ctx.fillStyle, fontOpacity); 
        ctx.fillText(`${values[i][j].toFixed(2)}`, x1 + cellSize/2, y1 + cellSize/2);

        if (strokeWidth > 0) {
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = strokeColor;
            ctx.strokeRect(x1, y1, x2, y2);
        }
    }));
}


function sliceChannels(imgArr, rowStart, rowEnd, colStart, colEnd) {
    return imgArr.map(matrix => matrix.slice(rowStart, rowEnd).map(i => i.slice(colStart, colEnd)));
}
