import * as THREE from 'three';
import {
    getSquareTextMesh, getMultiChannelColoredNumberTable
} from './pixel_tables.js';
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
    #inputGroup;
    #weightsGroup;
    #productGroup;
    #sumMesh;
    #outputMesh;
    #opShift;
    #opBoxOpacity;
    #productOutput;
    #macOutput;
    #output;
    constructor({
        input, weights, bias, color = 'rgb(0,64,122)',
        actFunc = (out, bias) => out > bias ? 1.0 : 0.0,
        actFuncToStr = (bias) => `> ${bias} ?`,
        cellSize = 100, numberOpacity = 1.0,
        colorOpacity = 0.1, channelMargin = 100,
        opShift = 500, opBoxOpacity = 0.1
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
        this.#opShift = 500;

        this.update();
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
    get inputGroup() {
        return this.#inputGroup;
    }
    get weightsGroup() {
        return this.#weightsGroup;
    }
    get productGroup() {
        return this.#productGroup;
    }
    get sumMesh() {
        return this.#sumMesh;
    }
    get outputMesh() {
        return this.#outputMesh;
    }

    get input() {
        return this.#input;
    }
    set input(input) {
        this.#input = input;
        this.#computeOutput();
        this.update();
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

    get weights() {
        return this.#weights;
    }
    set weights(weights) {
        this.#weights = weights;
        this.#computeProductOutput();
        this.update();
    }

    get bias() {
        return this.#bias;
    }
    set bias(bias) {
        this.#bias = bias;
        this.update();
    }

    get numChannels() {
        return this.#input.length;
    }

    get color() {
        return this.#color;
    }
    set color(color) {
        this.#color = color;
        this.update()
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
        this.update();
    }

    get colorOpacity() {
        return this.#colorOpacity;
    }
    set colorOpacity(colorOpacity) {
        this.#colorOpacity = colorOpacity;
        this.update();
    }

    get channelMargin() {
        return this.#channelMargin;
    }
    set channelMargin(channelMargin) {
        this.#channelMargin = channelMargin;
        this.update();
    }

    get pixelFontColor() {
        return `rgba(0, 0, 0, ${this.#numberOpacity})`;
    }

    numberToColor(x, channel) {
        x = Math.round(x * 255);
        const rgb = [0, 0, 0];
        if (this.numChannels === 1) {
            rgb[0] = x;
            rgb[1] = x;
            rgb[2] = x;
        } else if (this.numChannels === 3) {
            rgb[channel] = x;
        }
        return `rgba(${rgb.join(',')}, ${this.#colorOpacity})`;
    }

    update() {
        this.#group.clear();

        const numberToColor = (x, c) => this.numberToColor(x, c);
        this.#inputGroup = getMultiChannelColoredNumberTable({
            numbers: this.#input,
            numberToColor,
            cellSize: this.#cellSize,
            strokeWidth: this.strokeWidth,
            fontColor: this.pixelFontColor,
            channelMargin: this.#channelMargin
        });
        this.#inputGroup.name = "input";
        this.#group.add(this.#inputGroup);

        this.#weightsGroup = getMultiChannelColoredNumberTable({
            numbers: this.#weights,
            numberToColor,
            cellSize: this.#cellSize,
            strokeWidth: this.strokeWidth,
            fontColor: this.pixelFontColor,
            channelMargin: this.#channelMargin
        });
        this.#weightsGroup.position.z = this.#opShift;
        this.#weightsGroup.name = "weights"
        this.#group.add(this.#weightsGroup);

        this.#productGroup = getMultiChannelColoredNumberTable({
            numbers: this.#productOutput,
            numberToColor,
            cellSize: this.#cellSize,
            strokeWidth: this.strokeWidth,
            fontColor: this.pixelFontColor,
            channelMargin: this.#channelMargin
        });
        this.#productGroup.position.z = 2*this.#opShift;
        this.#productGroup.name = "productResult";
        this.#group.add(this.#productGroup);

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
            box.group.position.x = this.#inputGroup.children[i].position.x;
            box.frustum.renderOrder = 1;
            box.group.name = `productBox${i}`;
        });
        this.#productBoxes.forEach(box => this.#group.add(box.group));

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
            box.group.position.x = this.#weightsGroup.children[i].position.x;
            box.group.position.z = this.#weightsGroup.position.z;
            box.frustum.renderOrder = 2;
            box.group.name = `eqBox${i}`;
        });
        this.#equalsBoxes.forEach(box => this.#group.add(box.group));

        const totalInputSize = new THREE.Box3().setFromObject(this.#inputGroup).getSize(new THREE.Vector3())
        this.#sumBox = new OperandBox({
            color: this.#color,
            opacity: this.#opBoxOpacity,
            depth: this.#opShift,
            startWidth: totalInputSize.x,
            startHeight: totalInputSize.y,
            endHeight: this.#cellSize,
            opChar: "+",
        });
        this.#sumBox.group.position.z = this.#productGroup.position.z;
        this.#sumBox.frustum.renderOrder = 3;
        this.#sumBox.group.name = 'sumBox'
        this.#group.add(this.#sumBox.group);

        this.#sumMesh = getSquareTextMesh({
            text: this.#macOutput, size: this.#cellSize, fillColor: 'white',
        });
        const macMeshSize = new THREE.Box3().setFromObject(this.#sumMesh).getSize(new THREE.Vector3())
        this.#sumMesh.position.x = (this.#sumBox.startWidth - macMeshSize.x)/2;
        this.#sumMesh.position.y = (- this.#sumBox.startHeight + macMeshSize.y)/2;
        this.#sumMesh.position.z = this.#sumBox.group.position.z + this.#sumBox.depth;
        this.#sumMesh.name = 'sum'
        this.#group.add(this.#sumMesh);

        this.#activationBox = new OperandBox({
            color: this.#color,
            opacity: this.#opBoxOpacity,
            depth: this.#opShift,
            startHeight: this.#cellSize,
            opChar: this.#actFuncToStr(this.#bias),
        });
        this.#activationBox.group.position.x = this.#sumMesh.position.x;
        this.#activationBox.group.position.y = this.#sumMesh.position.y;
        this.#activationBox.group.position.z = this.#sumMesh.position.z;
        this.#activationBox.group.name = 'activationBox';
        this.#group.add(this.#activationBox.group);

        const invOut = 1 - this.#output;
        const uInt = x => Math.round(x * 255);
        this.#outputMesh = getSquareTextMesh({
            text: this.#output.toFixed(2), size: this.#cellSize,
            fillColor: `rgba(${uInt(this.#output)},${uInt(this.#output)},${uInt(this.#output)})`,
            fontColor: `rgba(${uInt(invOut)},${uInt(invOut)},${uInt(invOut)}, ${this.#numberOpacity})`,
        });
        const actBoxSize = new THREE.Box3().setFromObject(this.#activationBox.group).getSize(new THREE.Vector3());
        this.#outputMesh.position.x = this.#activationBox.group.position.x;
        this.#outputMesh.position.y = this.#activationBox.group.position.y;
        this.#outputMesh.position.z = this.#activationBox.group.position.z + actBoxSize.z;
        this.#outputMesh.renderOrder = 5;
        this.#outputMesh.name = 'output';
        this.#group.add(this.#outputMesh);
    }
}

function elWiseProduct(inputNumbers, weightNumbers) {
    return inputNumbers.map((row, i) => row.map((number, j) => number * weightNumbers[i][j]));
}
