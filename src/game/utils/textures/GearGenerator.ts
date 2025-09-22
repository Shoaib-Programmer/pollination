// src/game/utils/textures/GearGenerator.ts
import { BaseGenerator } from './BaseGenerator';

export class GearGenerator extends BaseGenerator {
    generate(): void {
        const gearSize = 32;
        const gearRadius = gearSize * 0.4;
        const toothHeight = gearSize * 0.15;
        const toothWidthBase = gearSize * 0.1;
        const toothWidthTop = gearSize * 0.06;
        const numTeeth = 8;
        const holeRadius = gearSize * 0.15;

        // Set style for the gear (silver color with dark outline)
        this.graphics.fillStyle(0xc0c0c0, 1);
        this.graphics.lineStyle(1, 0x555555, 1);

        // Draw teeth
        for (let i = 0; i < numTeeth; i++) {
            const angle = (Math.PI * 2 * i) / numTeeth;
            const angleMid = (Math.PI * 2 * (i + 0.5)) / numTeeth;

            // Outer points of the tooth
            const x1 =
                gearSize / 2 +
                Math.cos(angle - toothWidthTop / gearRadius) *
                    (gearRadius + toothHeight);
            const y1 =
                gearSize / 2 +
                Math.sin(angle - toothWidthTop / gearRadius) *
                    (gearRadius + toothHeight);
            const x2 =
                gearSize / 2 +
                Math.cos(angle + toothWidthTop / gearRadius) *
                    (gearRadius + toothHeight);
            const y2 =
                gearSize / 2 +
                Math.sin(angle + toothWidthTop / gearRadius) *
                    (gearRadius + toothHeight);

            // Inner points (base of the tooth)
            const x3 =
                gearSize / 2 +
                Math.cos(angleMid - toothWidthBase / gearRadius) * gearRadius;
            const y3 =
                gearSize / 2 +
                Math.sin(angleMid - toothWidthBase / gearRadius) * gearRadius;
            const x4 =
                gearSize / 2 +
                Math.cos(angleMid + toothWidthBase / gearRadius) * gearRadius;
            const y4 =
                gearSize / 2 +
                Math.sin(angleMid + toothWidthBase / gearRadius) * gearRadius;

            this.graphics.beginPath();
            this.graphics.moveTo(x3, y3);
            this.graphics.lineTo(x1, y1);
            this.graphics.lineTo(x2, y2);
            this.graphics.lineTo(x4, y4);
            // Implicitly closed by fill/stroke path

            this.graphics.fillPath();
            this.graphics.strokePath();
        }

        // Draw main body circle (over teeth bases)
        this.graphics.fillStyle(0xc0c0c0, 1);
        this.graphics.fillCircle(gearSize / 2, gearSize / 2, gearRadius);
        this.graphics.strokeCircle(gearSize / 2, gearSize / 2, gearRadius);

        // Draw center hole
        this.graphics.fillStyle(0x333333, 1); // Dark hole
        this.graphics.fillCircle(gearSize / 2, gearSize / 2, holeRadius);
        this.graphics.strokeCircle(gearSize / 2, gearSize / 2, holeRadius);

        // Generate the texture
        this.graphics.generateTexture(
            'gear_icon_generated',
            gearSize,
            gearSize
        );

        // Clean up
        this.cleanup();
    }
}
