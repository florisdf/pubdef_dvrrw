import * as THREE from 'three';
import { getSquareTextMesh } from './pixel_tables.js';


export class OperandBox {
    #width;
    #heightStart;
    #heightEnd;
    #opacity;
    #color;
    #opChar;
    #opSize;
    constructor({
        color,
        opacity,
        width,
        heightStart,
        heightEnd,
        opChar,
        opSize = height * 2/3,
    }) {
        this.#width = width;
        this.#heightStart = heightStart;
        this.#heightEnd = heightEnd;
        this.#opacity = opacity;
        this.#color = color;
        this.#opChar = opChar;
        this.#opSize = opSize;
        this.group = new THREE.Group();
        this.update();
    }
    update() {
        this.group.clear();

        if (this.width === 0) {
            return;
        }

        const geometry = new THREE.CylinderGeometry(this.#heightStart * Math.SQRT2 / 2, this.#heightEnd * Math.SQRT2 / 2, this.#width, 4, 1);
        geometry.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
        geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 4));
        geometry.computeVertexNormals(); // Compute the face normals for shading

        const frustumColor = new THREE.Color(this.#color);
        const fillMaterial = new THREE.MeshBasicMaterial({
            color: frustumColor,
            transparent: true,
            opacity: this.#opacity,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const frustumMesh = new THREE.Mesh(geometry, fillMaterial);

        const edgesMesh = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({color: frustumColor})
        );

        const frustumGroup = new THREE.Group();
        frustumGroup.add(frustumMesh);
        frustumGroup.add(edgesMesh);
        this.frustum = frustumGroup;

        const operandMesh = getSquareTextMesh({
            text: this.#opChar,
            size: this.#opSize*3/2, strokeWidth: 0,
            strokeColor: this.#color, fontSize: `${this.#opSize}px`
        });
        this.operand = operandMesh;

        this.frustum.position.x += this.#width/2;
        this.operand.position.x += this.#width/2;

        this.group.add(this.operand);
        this.group.add(this.frustum);
    }
    get width() {
        return this.#width;
    }
    set width(width) {
        this.#width = width;
        this.update();
    }
    get heightEnd() {
        return this.#heightEnd;
    }
    set heightEnd(heightEnd) {
        this.#heightEnd = heightEnd;
        this.update();
    }
    get heightStart() {
        return this.#heightStart;
    }
    get opSize() {
        return this.#opSize;
    }
    set opSize(opSize) {
        this.#opSize = opSize;
        this.update();
    }
}
