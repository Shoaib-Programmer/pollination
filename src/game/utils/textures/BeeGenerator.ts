// src/game/utils/textures/BeeGenerator.ts
import { BaseGenerator } from "./BaseGenerator";
import * as Phaser from "phaser";

export class BeeGenerator extends BaseGenerator {
    generate(): void {
        const beeSize = 32;
        const beeBodyY = beeSize / 2;
        const beeBodyWidth = beeSize * 0.6;
        const beeBodyHeight = beeSize * 0.45;
        const headRadius = beeSize * 0.2;
        const wingWidth = beeSize * 0.25;

        // Draw bee body (yellow ellipse)
        this.graphics.fillStyle(0xffd700, 1);
        this.graphics.fillEllipse(
            beeSize / 2,
            beeBodyY,
            beeBodyWidth,
            beeBodyHeight,
        );

        // Draw black stripes
        this.graphics.fillStyle(0x000000, 1);
        this.graphics.fillRect(
            beeSize / 2 - beeBodyWidth * 0.3,
            beeBodyY - beeBodyHeight / 2,
            beeBodyWidth * 0.2,
            beeBodyHeight,
        );
        this.graphics.fillRect(
            beeSize / 2 + beeBodyWidth * 0.1,
            beeBodyY - beeBodyHeight / 2,
            beeBodyWidth * 0.2,
            beeBodyHeight,
        );

        // Draw head
        this.graphics.fillCircle(
            beeSize / 2 + beeBodyWidth / 2 - headRadius * 0.3,
            beeBodyY,
            headRadius,
        );

        // Draw wings (semi-transparent blue)
        this.graphics.fillStyle(0xadd8e6, 0.7);

        // Top wing
        this.graphics
            .slice(
                beeSize / 2 - wingWidth * 0.4,
                beeBodyY - beeBodyHeight * 0.3,
                wingWidth,
                Phaser.Math.DegToRad(180),
                Phaser.Math.DegToRad(340),
                false,
            )
            .fillPath();

        // Bottom wing
        this.graphics
            .slice(
                beeSize / 2 - wingWidth * 0.4,
                beeBodyY + beeBodyHeight * 0.3,
                wingWidth,
                Phaser.Math.DegToRad(20),
                Phaser.Math.DegToRad(180),
                false,
            )
            .fillPath();

        // Generate the texture
        this.graphics.generateTexture("bee_generated", beeSize, beeSize);

        // Clean up
        this.cleanup();
    }
}
