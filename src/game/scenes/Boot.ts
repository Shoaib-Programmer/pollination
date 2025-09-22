// src/game/scenes/Boot.ts
import { Scene } from 'phaser';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Load minimal assets needed for the preloader, like a loading bar background
        // (Often, the preloader handles its own visual assets)
        this.load.image('logo', 'assets/logo.png'); // Example if your preloader uses a logo
    }

    create() {
        // Set up any global configurations if needed (like scaling)
        // this.scale.scaleMode = Phaser.Scale.FIT;
        // this.scale.autoCenter = Phaser.Scale.CENTER_BOTH;

        this.scene.start('Preloader');
    }
}
