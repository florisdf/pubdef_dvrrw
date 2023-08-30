import * as THREE from 'three';
import { TableCell, PixelTable } from './pixel_tables.js';
import { OperandBox } from './operand_box.js';


export class Neuron {
    #input;
    #weights;
    #bias;
    #group;
    #color;
    #actFunc;
    #actFuncToStr;
    #productBoxes;
    #equalsBoxes;
    #sumBox;
    #activationBox;
    #cellSize;
    #numberOpacity;
    #colorOpacity;
    #channelMargin;
    #inputTable;
    #weightsTable;
    #productTable;
    #sumCell;
    #outputCell;
    #opShift;
    #opBoxOpacity;
    #productOutput;
    #macOutput;
    #output;
    #precision;
    constructor({
        input, weights, bias, color = 'rgb(0,64,122)',
        actFunc = (out, bias) => out > bias ? 1.0 : 0.0,
        actFuncToStr = (bias) => `> ${bias} ?`,
        cellSize = 100, numberOpacity = 1.0,
        colorOpacity = 0.1, channelMargin = 100,
        opShift = 500, opBoxOpacity = 0.1, precision = 2,
    }) {
        this.#input = input;
        this.#weights = weights;
        this.#bias = bias;
        this.#actFunc = actFunc;

        this.#computeProductOutput();
        this.#computeMacOutput();
        this.#computeOutput();

        this.#group = new THREE.Group();
        this.#color = color;
        this.#actFuncToStr = actFuncToStr;
        this.#cellSize = cellSize;
        this.#numberOpacity = numberOpacity;
        this.#colorOpacity = colorOpacity;
        this.#opBoxOpacity = opBoxOpacity;
        this.#channelMargin = channelMargin;
        this.#opShift = opShift;
        this.#precision = precision;

        this.#createComponents();
        this.updatePositions();
    }

    get group() {
        return this.#group;
    }
    get productBoxes() {
        return this.#productBoxes
    }
    get equalsBoxes() {
        return this.#equalsBoxes
    }
    get sumBox() {
        return this.#sumBox
    }
    get activationBox() {
        return this.#activationBox
    }
    get inputTable() {
        return this.#inputTable;
    }
    get weightsTable() {
        return this.#weightsTable;
    }
    get productTable() {
        return this.#productTable;
    }
    get sumCell() {
        return this.#sumCell;
    }
    get outputCell() {
        return this.#outputCell;
    }

    get input() {
        return this.#input;
    }
    get weights() {
        return this.#weights;
    }
    get bias() {
        return this.#bias;
    }

    #computeProductOutput() {
        this.#productOutput = this.#input.map((ch, i) => elWiseProduct(ch, this.#weights[i]));
    }
    #computeMacOutput() {
        this.#macOutput = (this.#productOutput.flat().flat().reduce((acc, curr) => acc + curr, 0)).toFixed(1);
    }
    #computeOutput() {
        this.#output = this.#actFunc(this.#macOutput, this.#bias);
    }

    get numChannels() {
        return this.#input.length;
    }

    get color() {
        return this.#color;
    }

    get cellSize() {
        return this.#cellSize;
    }
    get tableSize() {
        return this.#input[0].length * this.#cellSize;
    }
    get strokeWidth() {
        return this.numberOpacity * 3;
    }

    get numberOpacity() {
        return this.#numberOpacity;
    }
    set numberOpacity(numberOpacity) {
        this.#numberOpacity = numberOpacity;
        [
            this.#inputTable, this.#weightsTable, this.#productTable
        ].forEach(table => {
            table.updateCellStyle({fontOpacity: this.#numberOpacity});
        });
        this.#outputCell.updateStyle({
            fontOpacity: this.#numberOpacity,
        });
    }

    get colorOpacity() {
        return this.#colorOpacity;
    }
    set colorOpacity(colorOpacity) {
        this.#colorOpacity = colorOpacity;
        [
            this.#inputTable, this.#weightsTable, this.#productTable
        ].forEach(table => {
            table.updateCellStyle({fillOpacity: this.#colorOpacity});
        });
    }

    get channelMargin() {
        return this.#channelMargin;
    }
    set channelMargin(channelMargin) {
        this.#channelMargin = channelMargin;
        [
            this.#inputTable, this.#weightsTable, this.#productTable
        ].forEach(table => {
            table.channelMargin = this.#channelMargin;
        });

        this.#sumBox.startWidth = this.#inputTable.size.x;
        this.updatePositions();
    }

    valueToColor(x, channel) {
        x = Math.round(x * 255);
        const rgb = [0, 0, 0];
        if (this.numChannels === 1) {
            rgb[0] = x;
            rgb[1] = x;
            rgb[2] = x;
        } else if (this.numChannels === 3) {
            rgb[channel] = x;
        }
        return `rgb(${rgb.join(',')})`;
    }

    #createComponents() {
        this.#group.clear();

        const valueToColor = (x, c) => this.valueToColor(x, c);
        this.#inputTable = new PixelTable({
            values: this.#input,
            valueToColor,
            cellSize: this.#cellSize,
            strokeWidth: this.strokeWidth,
            channelMargin: this.#channelMargin,
            fillOpacity: this.#colorOpacity,
            fontOpacity: this.#numberOpacity,
        });
        this.#inputTable.group.name = "input";
        this.#group.add(this.#inputTable.group);

        this.#weightsTable = new PixelTable({
            values: this.#weights,
            valueToColor,
            cellSize: this.#cellSize,
            strokeWidth: this.strokeWidth,
            channelMargin: this.#channelMargin,
            fillOpacity: this.#colorOpacity,
            fontOpacity: this.#numberOpacity,
        });
        this.#weightsTable.group.position.z = this.#opShift;
        this.#weightsTable.group.name = "weights"
        this.#group.add(this.#weightsTable.group);

        this.#productTable = new PixelTable({
            values: this.#productOutput,
            valueToColor,
            cellSize: this.#cellSize,
            strokeWidth: this.strokeWidth,
            channelMargin: this.#channelMargin,
            fillOpacity: this.#colorOpacity,
            fontOpacity: this.#numberOpacity,
        });
        this.#productTable.group.position.z = 2*this.#opShift;
        this.#productTable.group.name = "productResult";
        this.#group.add(this.#productTable.group);

        this.#productBoxes = _.range(this.numChannels).map(
            () => new OperandBox({
                color: this.#color,
                opacity: this.#opBoxOpacity,
                depth: this.#opShift,
                startHeight: this.tableSize,
                opChar: "×",
            })
        );
        this.#productBoxes.forEach((box, i) => {
            box.group.name = `productBox${i}`;
            this.#group.add(box.group);
        });

        this.#equalsBoxes = _.range(this.numChannels).map(
            () => new OperandBox({
                color: this.#color,
                opacity: this.#opBoxOpacity,
                depth: this.#opShift,
                startHeight: this.tableSize,
                opChar: "=",
            })
        );
        this.#equalsBoxes.forEach((box, i) => {
            box.group.name = `eqBox${i}`;
            this.#group.add(box.group);
        });

        this.#sumBox = new OperandBox({
            color: this.#color,
            opacity: this.#opBoxOpacity,
            depth: this.#opShift,
            startWidth: this.#inputTable.size.x,
            startHeight: this.#inputTable.size.y,
            endHeight: this.#cellSize,
            opChar: "+",
        });
        this.#sumBox.group.name = 'sumBox'
        this.#group.add(this.#sumBox.group);

        this.#sumCell = new TableCell({
            text: this.#macOutput, width: this.#cellSize, height: this.#cellSize, fillColor: 'white',
        });
        this.#sumCell.group.name = 'sum'
        this.#group.add(this.#sumCell.group);

        this.#activationBox = new OperandBox({
            color: this.#color,
            opacity: this.#opBoxOpacity,
            depth: this.#opShift,
            startHeight: this.#cellSize,
            opChar: this.#actFuncToStr(this.#bias),
        });
        this.#activationBox.group.name = 'activationBox';
        this.#group.add(this.#activationBox.group);

        this.#outputCell = new TableCell({
            text: this.#output.toFixed(this.#precision),
            width: this.#cellSize,
            height: this.#cellSize,
            fillColor: this.outputFillColor,
            fontColor: this.outputFontColor,
            fontOpacity: this.#numberOpacity,
        });
        this.#outputCell.group.name = 'output';
        this.#group.add(this.#outputCell.group);
    }

    updatePositions() {
        this.#productBoxes.forEach((box, i) => {
            box.group.position.x = this.#inputTable.group.children[i].position.x;
            box.frustum.renderOrder = 1;
        });

        this.#equalsBoxes.forEach((box, i) => {
            box.group.position.x = this.#weightsTable.group.children[i].position.x;
            box.group.position.z = this.#weightsTable.group.position.z;
            box.frustum.renderOrder = 2;
        });

        this.#sumBox.group.position.z = this.#productTable.group.position.z;
        this.#sumBox.frustum.renderOrder = 1;

        const macMeshSize = new THREE.Box3().setFromObject(this.#sumCell.group).getSize(new THREE.Vector3())
        this.#sumCell.group.position.x = (this.#sumBox.startWidth - macMeshSize.x)/2;
        this.#sumCell.group.position.y = (- this.#sumBox.startHeight + macMeshSize.y)/2;
        this.#sumCell.group.position.z = this.#sumBox.group.position.z + this.#sumBox.depth;

        this.#activationBox.group.position.x = this.#sumCell.group.position.x;
        this.#activationBox.group.position.y = this.#sumCell.group.position.y;
        this.#activationBox.group.position.z = this.#sumCell.group.position.z;

        const actBoxSize = new THREE.Box3().setFromObject(this.#activationBox.group).getSize(new THREE.Vector3());
        this.#outputCell.group.position.x = this.#activationBox.group.position.x;
        this.#outputCell.group.position.y = this.#activationBox.group.position.y;
        this.#outputCell.group.position.z = this.#activationBox.group.position.z + actBoxSize.z;
        this.#outputCell.group.renderOrder = 5;
    }

    get outputFillColor() {
        return `rgb(${uInt(this.#output)},${uInt(this.#output)},${uInt(this.#output)})`;
    }

    get outputFontColor() {
        const invOut = this.#output < 0.3 ? 1 - this.#output : this.#output;
        return `rgb(${uInt(invOut)},${uInt(invOut)},${uInt(invOut)})`;
    }
}

const uInt = x => Math.round(x * 255);

function elWiseProduct(inputNumbers, weightNumbers) {
    return inputNumbers.map((row, i) => row.map((number, j) => number * weightNumbers[i][j]));
}
