// src/game/utils/textures/BackgroundGenerator.ts
import { BaseGenerator } from './BaseGenerator';
import * as Phaser from 'phaser';

export class BackgroundGenerator extends BaseGenerator {
    generate(): void {
        const bgWidth = this.scene.cameras.main.width;
        const bgHeight = this.scene.cameras.main.height;

        this.graphics.fillStyle(0x228b22, 1); // Base green color
        this.graphics.fillRect(0, 0, bgWidth, bgHeight);

        // Add texture variation with lighter green patches
        this.graphics.fillStyle(0x3cb371, 0.4);
        for (let i = 0; i < 2000; i++) {
            const x = Phaser.Math.Between(0, bgWidth);
            const y = Phaser.Math.Between(0, bgHeight);
            const width = Phaser.Math.Between(1, 3);
            const height = Phaser.Math.Between(2, 5);
            this.graphics.fillRect(x, y, width, height);
        }

        // Generate the texture
        this.graphics.generateTexture(
            'background_generated',
            bgWidth,
            bgHeight
        );

        // Clean up
        this.cleanup();
    }
}
