// src/game/utils/textures/BaseGenerator.ts
import { Scene } from "phaser";
import { GeneratorOptions } from "./types";

export abstract class BaseGenerator {
    protected scene: Scene;
    protected graphics: Phaser.GameObjects.Graphics;
    protected updateProgress?: () => void;

    constructor(options: GeneratorOptions) {
        this.scene = options.scene;
        this.updateProgress = options.updateProgress;
        this.graphics = this.scene.make.graphics();
    }

    abstract generate(): void;

    protected cleanup(): void {
        this.graphics.clear();
        if (this.updateProgress) this.updateProgress();
    }

    public destroy(): void {
        this.graphics.destroy();
    }
}
