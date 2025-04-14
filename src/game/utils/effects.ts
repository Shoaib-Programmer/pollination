// src/game/utils/effects.ts
import * as Phaser from "phaser";

/**
 * Creates particle effects at a specific location
 * @param scene The Phaser scene
 * @param x X coordinate
 * @param y Y coordinate
 * @param texture Texture key to use for particles
 * @param tint Color tint for particles
 * @param count Number of particles to emit
 */
export function createParticles(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    tint: number,
    count: number = 10
): void {
    if (!scene.textures.exists(texture)) return;

    const particles = scene.add.particles(x, y, texture, {
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.5, end: 0 },
        lifespan: { min: 300, max: 600 },
        gravityY: 80,
        blendMode: "ADD",
        tint: tint,
        emitting: false,
    });

    if (particles) {
        particles.explode(count);
        scene.time.delayedCall(1500, () => {
            particles?.destroy();
        });
    }
}

/**
 * Creates a brief scale pulse animation on a game object
 * @param scene The Phaser scene
 * @param target The target game object to pulse
 * @param scaleAmount Maximum scale multiplier for the pulse
 */
export function addInteractionPulse(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.Sprite,
    scaleAmount: number = 1.15
): void {
    if (!target?.active) return;

    const startScaleX = target.scaleX;
    const startScaleY = target.scaleY;

    scene.tweens.killTweensOf(target);
    scene.tweens.add({
        targets: target,
        scaleX: startScaleX * scaleAmount,
        scaleY: startScaleY * scaleAmount,
        duration: 120,
        yoyo: true,
        ease: "Sine.easeInOut",
    });
}
