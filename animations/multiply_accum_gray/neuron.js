import * as THREE from 'three';
import {
    getSquareTextMesh, getColorTable,
    getMultiChannelColoredNumberTable
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
    constructor({
        input, weights, bias, color = 'rgb(0,64,122)',
        actFunc = (out, bias) => out > bias ? 1.0 : 0.0,
        actFuncToStr = (bias) => `> ${bias} ?`
    }) {
        this.#input = input;
        this.#weights = weights;
        this.#bias = bias;
        this.#group = new THREE.Group();
        this.#color = color;
        this.#actFunc = actFunc;
        this.#actFuncToStr = actFuncToStr;

        this.update();
    }

    update() {
        const {
            productBoxes,
            equalsBoxes,
            sumBox,
            activationBox,
        } = createNeuron({
            input: this.#input,
            weights: this.#weights,
            bias: this.#bias,
            group: this.#group,
            color: this.#color,
            actFunc: this.#actFunc,
            actFuncToStr: this.#actFuncToStr,
        });
        this.#productBoxes = productBoxes;
        this.#equalsBoxes = equalsBoxes;
        this.#sumBox = sumBox;
        this.#activationBox = activationBox;
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

    get input() {
        return this.#input;
    }
    set input(input) {
        this.#input = input;
        this.update();
    }

    get weights() {
        return this.#weights;
    }
    set weights(weights) {
        this.#weights = weights;
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
}

function createNeuron({
    input, weights, bias, group,
    color,
    prodBoxHeight,
    actFunc, actFuncToStr
}) {
    const cellSize = 100;
    const strokeWidth = cellSize / 100;
    const numChannels = input.length;
    const opShift = 500;

    const numberToColor = (x, channel) => {
        x = Math.round(x * 255);
        const rgb = [0, 0, 0];
        if (numChannels === 1) {
            rgb[0] = x;
            rgb[1] = x;
            rgb[2] = x;
        } else if (numChannels === 3) {
            rgb[channel] = x;
        }
        return `rgba(${rgb.join(',')}, 0.3)`;
    };

    const inputGroup = getMultiChannelColoredNumberTable({
        numbers: input,
        numberToColor,
        cellSize,
        strokeWidth,
    });
    inputGroup.name = "input";
    group.add(inputGroup);

    const inputImageGroup = getColorTable({
        colors: input[0].map((row, i) => row.map((x, j) => {
                if (numChannels === 1) {
                    x = Math.round(x*255);
                    return `rgb(${x}, ${x}, ${x})`;
                } else if (numChannels === 3) {
                    const r = Math.round(x*255);
                    const g = Math.round(input[1][i][j] * 255);
                    const b = Math.round(input[2][i][j] * 255);
                    return `rgb(${r}, ${g}, ${b})`;
                }
            })),
        cellSize,
    });
    const midChannel = Math.floor(inputGroup.children.length / 2);
    inputImageGroup.position.x = inputGroup.children[midChannel].position.x
    inputImageGroup.name = "inputImage";
    group.add(inputImageGroup);

    const weightsGroup = getMultiChannelColoredNumberTable({
        numbers: weights,
        numberToColor,
        cellSize,
        strokeWidth,
    });
    weightsGroup.position.z = opShift;
    weightsGroup.name = "weights"
    group.add(weightsGroup);

    const productNumbers = input.map((ch, i) => elWiseProduct(ch, weights[i]));
    const productGroup = getMultiChannelColoredNumberTable({
        numbers: productNumbers,
        numberToColor,
        cellSize,
        strokeWidth,
    });
    productGroup.position.z = 2*opShift;
    productGroup.name = "productResult";
    group.add(productGroup);

    const tableSize = new THREE.Box3().setFromObject(inputGroup).getSize(new THREE.Vector3())

    const productBoxes = _.range(numChannels).map(
        () => new OperandBox({
            color: color,
            opacity: 0.1,
            depth: opShift,
            startHeight: tableSize.y,
            opChar: "×",
        })
    );
    productBoxes.forEach((box, i) => {
        box.group.position.x = inputGroup.children[i].position.x;
        box.frustum.renderOrder = 1;
        box.group.name = `productBox${i}`;
    });
    productBoxes.forEach(box => group.add(box.group));

    const equalsBoxes = _.range(numChannels).map(
        () => new OperandBox({
            color: color,
            opacity: 0.1,
            depth: opShift,
            startHeight: tableSize.y,
            opChar: "=",
        })
    );
    equalsBoxes.forEach((box, i) => {
        box.group.position.x = weightsGroup.children[i].position.x;
        box.group.position.z = weightsGroup.position.z;
        box.frustum.renderOrder = 2;
        box.group.name = `eqBox${i}`;
    });
    equalsBoxes.forEach(box => group.add(box.group));

    const sumBox = new OperandBox({
        color: color,
        opacity: 0.05,
        depth: opShift,
        startWidth: tableSize.x,
        startHeight: tableSize.y,
        endHeight: cellSize,
        opChar: "+",
    });
    sumBox.group.position.z = productGroup.position.z;
    sumBox.frustum.renderOrder = 3;
    sumBox.group.name = 'sumBox'
    group.add(sumBox.group);

    const macResult = (productNumbers.flat().flat().reduce((acc, curr) => acc + curr, 0)).toFixed(1);
    const sumMesh = getSquareTextMesh({text: macResult, size: cellSize, fillColor: 'white'});
    const macMeshSize = new THREE.Box3().setFromObject(sumMesh).getSize(new THREE.Vector3())
    sumMesh.position.x = (sumBox.startWidth - macMeshSize.x)/2;
    sumMesh.position.y = (- sumBox.startHeight + macMeshSize.y)/2;
    sumMesh.position.z = sumBox.group.position.z + sumBox.depth;
    sumMesh.name = 'sum'
    group.add(sumMesh);

    const activationBox = new OperandBox({
        color: color,
        opacity: 0.1,
        depth: opShift,
        startHeight: cellSize,
        opChar: actFuncToStr(bias),
    });
    activationBox.group.position.x = sumMesh.position.x;
    activationBox.group.position.y = sumMesh.position.y;
    activationBox.group.position.z = sumMesh.position.z;
    activationBox.group.name = 'activationBox';
    group.add(activationBox.group);

    const output = actFunc(macResult, bias).toFixed(2);
    const invOut = 1 - output;
    const uInt = x => Math.round(x * 255);
    const outputMesh = getSquareTextMesh({
        text: output, size: cellSize,
        fillColor: `rgb(${uInt(output)},${uInt(output)},${uInt(output)})`,
        fontColor: `rgb(${uInt(invOut)},${uInt(invOut)},${uInt(invOut)})`,
    });
    const actBoxSize = new THREE.Box3().setFromObject(activationBox.group).getSize(new THREE.Vector3());
    outputMesh.position.x = activationBox.group.position.x;
    outputMesh.position.y = activationBox.group.position.y;
    outputMesh.position.z = activationBox.group.position.z + actBoxSize.z;
    outputMesh.renderOrder = 5;
    outputMesh.name = 'output';
    group.add(outputMesh);

    return {
        neuronGroup: group,
        productBoxes,
        equalsBoxes,
        sumBox,
        activationBox,
    };
}


function elWiseProduct(inputNumbers, weightNumbers) {
    return inputNumbers.map((row, i) => row.map((number, j) => number * weightNumbers[i][j]));
}
