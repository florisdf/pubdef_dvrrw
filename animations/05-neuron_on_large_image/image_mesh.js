import * as THREE from 'three';


export class ImageMesh {
    constructor ({
        imagePath,
        width,
        aspect = 1.0,
    }) {
        this.imagePath = imagePath;
        this.width = width;
        this.height = aspect * width;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = this.imagePath;
        this.canvas = document.createElement("canvas");

        this.canvasTexture = new THREE.CanvasTexture(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        img.addEventListener("load", () => {
            console.log('load')
            console.log(img)
            // img.style.display = "none";
            this.ctx.fillStyle = "black";
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.canvasTexture.needsUpdate = true;
            this.ctx.drawImage(img, 0, 0);
        });

        this.material = new THREE.MeshBasicMaterial({
            map: this.canvasTexture,
            transparent: true,
            side: THREE.DoubleSide,
        })
        this.geometry = new THREE.PlaneGeometry(this.width, this.height);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }
}
