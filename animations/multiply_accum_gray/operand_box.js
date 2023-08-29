import * as THREE from 'three';
import { getSquareTextMesh } from './pixel_tables.js';


export class OperandBox {
    #depth;
    #startHeight;
    #endHeight;
    #startWidth;
    #endWidth;
    #opacity;
    #color;
    #opChar;
    #opSize;
    constructor({
        color,
        opacity,
        depth,
        startHeight,
        startWidth = startHeight,
        endHeight = startHeight,
        endWidth = endHeight,
        opChar,
        opSize = height * 2/3,
    }) {
        this.#depth = depth;
        this.#startHeight = startHeight;
        this.#endHeight = endHeight;
        this.#startWidth = startWidth;
        this.#endWidth = endWidth;
        this.#opacity = opacity;
        this.#color = color;
        this.#opChar = opChar;
        this.#opSize = opSize;
        this.group = new THREE.Group();
        this.update();
    }
    update() {
        this.group.clear();

        if (this.depth === 0) {
            return;
        }

        const tlFrontX = (this.#startWidth - this.#endWidth)/2;
        const tlFrontY = (-this.#startHeight + this.#endHeight)/2;
        const vertices = [
            0, 0, 0,                                               // 0: top-left back (origin)
            this.#startWidth, 0, 0,                                // 1: top-right back
            0, -this.#startHeight, 0,                              // 2: bottom-left back
            this.#startWidth, -this.#startHeight, 0,               // 3: bottom-right back
            tlFrontX, tlFrontY, this.#depth,                                     // 4: top-left front
            tlFrontX + this.#endWidth, tlFrontY, this.#depth,                   // 5: top-right front
            tlFrontX, tlFrontY - this.#endHeight, this.#depth,                 // 6: bottom-left front
            tlFrontX + this.#endWidth, tlFrontY - this.#endHeight, this.#depth,  // 7: bottom-right front
        ];

        // Define indices for the faces
        const indices = [
            0, 1, 2,  // back
            1, 3, 2,
            4, 5, 6,  // front
            5, 7, 6,
            0, 4, 1,  // top
            4, 5, 1,
            2, 3, 6,  // bottom
            3, 7, 6,
            0, 2, 4,  // left
            2, 6, 4,
            1, 5, 3,  // right
            5, 7, 3
        ];

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);

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

        const opMeshSize = this.#opSize*3/2;
        const operandMesh = getSquareTextMesh({
            text: this.#opChar,
            size: opMeshSize, strokeWidth: 0,
            strokeColor: this.#color, fontSize: `${this.#opSize}px`,
        });
        operandMesh.rotation.y = - Math.PI / 2;
        operandMesh.position.x = this.#startWidth/2;
        operandMesh.position.y = opMeshSize/2 - this.#startHeight/2;
        operandMesh.position.z = (- opMeshSize + this.#depth)/2;
        this.operand = operandMesh;

        this.group.add(this.operand);
        this.group.add(this.frustum);
    }
    get depth() {
        return this.#depth;
    }
    set depth(depth) {
        this.#depth = depth;
        this.update();
    }
    get endHeight() {
        return this.#endHeight;
    }
    get endWidth() {
        return this.#endHeight;
    }
    set endHeight(endHeight) {
        this.#endHeight = endHeight;
        this.update();
    }
    set endWidth(endWidth) {
        this.#endWidth = endWidth;
        this.update();
    }
    get startHeight() {
        return this.#startHeight;
    }
    get startWidth() {
        return this.#startWidth;
    }
    set startHeight(startHeight) {
        this.#startHeight = startHeight;
        this.update();
    }
    set startWidth(startWidth) {
        this.#startWidth = startWidth;
        this.update();
    }
    get opSize() {
        return this.#opSize;
    }
    set opSize(opSize) {
        this.#opSize = opSize;
        this.update();
    }
}
