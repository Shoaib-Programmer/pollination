// src/game/utils/animation.ts
import * as Phaser from "phaser";

export interface TweenConfig {
    targets: unknown;
    properties: Record<string, unknown>;
    duration?: number;
    ease?: string;
    yoyo?: boolean;
    repeat?: number;
    delay?: number;
    onComplete?: () => void;
}

/**
 * Creates a standard button hover tween
 */
export function createButtonHoverTween(
    scene: Phaser.Scene,
    targets: unknown,
    scaleMultiplier: number = 1.08,
    duration: number = 150,
): Phaser.Tweens.Tween {
    return scene.tweens.add({
        targets,
        scale: scaleMultiplier,
        duration,
        ease: "Sine.easeInOut",
    });
}

/**
 * Creates a standard button click tween
 */
export function createButtonClickTween(
    scene: Phaser.Scene,
    target: unknown,
    scaleMultiplier: number = 0.95,
    duration: number = 80,
): Phaser.Tweens.Tween {
    return scene.tweens.add({
        targets: target,
        scale: scaleMultiplier,
        duration,
        ease: "Sine.easeInOut",
        yoyo: true,
    });
}

/**
 * Creates a fade in animation
 */
export function createFadeInTween(
    scene: Phaser.Scene,
    target: unknown,
    duration: number = 400,
    delay: number = 0,
): Phaser.Tweens.Tween {
    return scene.tweens.add({
        targets: target,
        alpha: 1,
        duration,
        delay,
        ease: "Power2.out",
    });
}

/**
 * Creates a fade out animation
 */
export function createFadeOutTween(
    scene: Phaser.Scene,
    target: unknown,
    duration: number = 300,
    onComplete?: () => void,
): Phaser.Tweens.Tween {
    return scene.tweens.add({
        targets: target,
        alpha: 0,
        duration,
        ease: "Power1.in",
        onComplete,
    });
}

/**
 * Creates a scale animation
 */
export function createScaleTween(
    scene: Phaser.Scene,
    target: unknown,
    scale: number,
    duration: number = 400,
    delay: number = 0,
    ease: string = "back.out(1.7)",
): Phaser.Tweens.Tween {
    return scene.tweens.add({
        targets: target,
        scale,
        duration,
        delay,
        ease,
    });
}

/**
 * Creates a floating score text animation
 */
export function createFloatingScoreTween(
    scene: Phaser.Scene,
    scoreText: Phaser.GameObjects.Text,
    points: number,
    duration: number = 1500,
): void {
    scene.tweens.add({
        targets: scoreText,
        y: "-=50",
        alpha: 0,
        duration,
        ease: "Power1",
        onComplete: () => scoreText.destroy(),
    });
}

/**
 * Creates a pulse animation for UI elements
 */
export function createPulseTween(
    scene: Phaser.Scene,
    target: unknown,
    scaleAmount: number = 1.05,
    duration: number = 80,
): Phaser.Tweens.Tween {
    return scene.tweens.add({
        targets: target,
        scale: scaleAmount,
        duration,
        yoyo: true,
        ease: "Sine.easeInOut",
    });
}

/**
 * Creates a staggered entrance animation for multiple elements
 */
export function createStaggeredEntrance(
    scene: Phaser.Scene,
    elements: unknown[],
    staggerDelay: number = 0.1,
    baseDelay: number = 0.3,
): void {
    elements.forEach((element, index) => {
        const delay = baseDelay + index * staggerDelay;
        createFadeInTween(scene, element, 400, delay * 1000);
        createScaleTween(scene, element, 1, 400, delay * 1000);
    });
}

/**
 * Creates a transition out animation for multiple elements
 */
export function createTransitionOut(
    scene: Phaser.Scene,
    elements: unknown[],
    onComplete?: () => void,
): void {
    elements.forEach((element, index) => {
        const delay = index * 100;
        scene.tweens.add({
            targets: element,
            alpha: 0,
            y: "-=30",
            duration: 300,
            delay,
            ease: "power1.in",
            onComplete: index === elements.length - 1 ? onComplete : undefined,
        });
    });
}
