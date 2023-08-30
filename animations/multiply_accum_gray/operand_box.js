import * as THREE from 'three';
import { TableCell } from './pixel_tables.js';


export class OperandBox {
    #depth;
    #startHeight;
    #endHeight;
    #startWidth;
    #endWidth;
    #opacity;
    #color;
    #opChar;
    constructor({
        color,
        opacity,
        depth,
        startHeight,
        startWidth = startHeight,
        endHeight = startHeight,
        endWidth = endHeight,
        opChar,
    }) {
        this.#depth = depth;
        this.#startHeight = startHeight;
        this.#endHeight = endHeight;
        this.#startWidth = startWidth;
        this.#endWidth = endWidth;
        this.#opacity = opacity;
        this.#color = color;
        this.#opChar = opChar;
        this.group = new THREE.Group();
        this.#createComponents();
    }

    get frustumVertices() {
        const tlFrontX = (this.#startWidth - this.#endWidth)/2;
        const tlFrontY = (-this.#startHeight + this.#endHeight)/2;
        return [
            0, 0, 0,                                               // 0: top-left back (origin)
            this.#startWidth, 0, 0,                                // 1: top-right back
            0, -this.#startHeight, 0,                              // 2: bottom-left back
            this.#startWidth, -this.#startHeight, 0,               // 3: bottom-right back
            tlFrontX, tlFrontY, this.#depth,                                     // 4: top-left front
            tlFrontX + this.#endWidth, tlFrontY, this.#depth,                   // 5: top-right front
            tlFrontX, tlFrontY - this.#endHeight, this.#depth,                 // 6: bottom-left front
            tlFrontX + this.#endWidth, tlFrontY - this.#endHeight, this.#depth,  // 7: bottom-right front
        ];
    }

    get frustumIndices() {
        return [
            0, 4, 1,  // top
            4, 5, 1,
            2, 3, 6,  // bottom
            3, 7, 6,
            0, 2, 4,  // left
            2, 6, 4,
            1, 5, 3,  // right
            5, 7, 3
        ];
    }

    #createComponents() {
        this.group.clear();

        if (this.depth === 0) {
            return;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.frustumVertices, 3));
        geometry.setIndex(this.frustumIndices);

        const frustumColor = new THREE.Color(this.#color);
        const fillMaterial = new THREE.MeshBasicMaterial({
            color: frustumColor,
            transparent: true,
            opacity: this.#opacity,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        this.frustumMesh = new THREE.Mesh(geometry, fillMaterial);

        this.edgesMesh = new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry),
            new THREE.LineBasicMaterial({
                color: frustumColor,
            })
        );

        const frustumGroup = new THREE.Group();
        frustumGroup.add(this.frustumMesh);
        frustumGroup.add(this.edgesMesh);
        frustumGroup.name = 'frustum';
        this.frustum = frustumGroup;

        const operandCell = new TableCell({
            text: this.#opChar,
            height: this.opCellHeight, strokeWidth: 0,
            fontColor: this.#color, fontSize: this.opFontSize,
        });
        operandCell.group.children[0].geometry.applyMatrix4(
            new THREE.Matrix4().makeTranslation(-operandCell.width/2, operandCell.height/2, 0)
        );
        this.operandCell = operandCell;
        this.operand = operandCell.group;
        this.updateOperandPosition();

        this.group.add(this.operand);
        this.group.add(this.frustum);

        this.frustumMesh.renderOrder = 1;
        this.operand.renderOrder = this.frustumMesh.renderOrder + 1;
        this.edgesMesh.renderOrder = this.operand.renderOrder + 1;
    }

    get opSize() {
        return this.#startHeight * 2/3;
    }
    get opFontSize() {
        return `${this.opSize}px`;
    }
    get opCellHeight () {
        return this.opSize*3/2;
    }

    updateOperandPosition() {
        const opGroup = this.operandCell.group;
        opGroup.rotation.y = - Math.PI / 2;
        opGroup.position.x = this.#startWidth/2;
        opGroup.position.y = - this.#startHeight/2;
        opGroup.position.z = this.#depth/2;

        const scale = this.opCellHeight / this.operandCell.height;
        opGroup.scale.x = scale;
        opGroup.scale.y = scale;
    }

    get depth() {
        return this.#depth;
    }
    get endHeight() {
        return this.#endHeight;
    }
    get endWidth() {
        return this.#endHeight;
    }
    get startHeight() {
        return this.#startHeight;
    }
    get startWidth() {
        return this.#startWidth;
    }

    updateFrustumGeometry() {  
        const posAttrFrust = this.frustumMesh.geometry.getAttribute('position');
        posAttrFrust.set(this.frustumVertices);
        posAttrFrust.needsUpdate = true;
        this.frustumMesh.geometry.computeBoundingBox();
        this.frustumMesh.geometry.computeBoundingSphere();

        const edgesGeometry = new THREE.EdgesGeometry(this.frustumMesh.geometry);
        this.edgesMesh.geometry.dispose(); // Dispose the old edges geometry
        this.edgesMesh.geometry = edgesGeometry;

        this.updateOperandPosition()
    }

    set startWidth(startWidth) {
        this.#startWidth = startWidth;
        this.updateFrustumGeometry();
    }
    set startHeight(startHeight) {
        this.#startHeight = startHeight;
        this.updateFrustumGeometry();
    }
    set endWidth(endWidth) {
        this.#endWidth = endWidth;
        this.updateFrustumGeometry();
    }
    set endHeight(endHeight) {
        this.#endHeight = endHeight;
        this.updateFrustumGeometry();
    }

    updateWidthHeight({
        startWidth = this.#startWidth,
        startHeight = this.#startHeight,
        endWidth = this.#endWidth,
        endHeight = this.#endHeight
    }) {
        this.#startWidth = startWidth;
        this.#startHeight = startHeight;
        this.#endWidth = endWidth;
        this.#endHeight = endHeight;
        this.updateFrustumGeometry();
    }
}
