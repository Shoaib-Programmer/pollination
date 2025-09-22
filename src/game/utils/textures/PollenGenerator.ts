// src/game/utils/textures/PollenGenerator.ts
import { BaseGenerator } from './BaseGenerator';

export class PollenGenerator extends BaseGenerator {
    generate(): void {
        const pollenSize = 10;

        // Draw pollen particle (yellow circle)
        this.graphics.fillStyle(0xffff00, 1);
        this.graphics.fillCircle(
            pollenSize / 2,
            pollenSize / 2,
            pollenSize * 0.4
        );

        // Generate the texture
        this.graphics.generateTexture(
            'pollen_particle_generated',
            pollenSize,
            pollenSize
        );

        // Clean up
        this.cleanup();
    }
}
