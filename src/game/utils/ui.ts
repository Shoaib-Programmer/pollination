// src/game/utils/ui.ts
import * as Phaser from "phaser";

export interface ButtonConfig {
    text: string;
    x: number;
    y: number;
    backgroundColor: string;
    hoverColor: string;
    fontSize?: string;
    fontFamily?: string;
    padding?: { x: number; y: number };
    shadow?: {
        offsetX: number;
        offsetY: number;
        color: string;
        blur: number;
        fill: boolean;
    };
}

export interface ButtonInteractionConfig {
    onHover?: () => void;
    onOut?: () => void;
    onClick: () => void;
    scaleMultiplier?: number;
    clickScaleMultiplier?: number;
    hoverDuration?: number;
    clickDuration?: number;
}

/**
 * Creates a styled button with consistent styling
 */
export function createStyledButton(
    scene: Phaser.Scene,
    config: ButtonConfig
): Phaser.GameObjects.Text {
    const defaultConfig = {
        fontSize: "28px",
        fontFamily: "var(--font-poppins)",
        padding: { x: 25, y: 12 },
        shadow: {
            offsetX: 2,
            offsetY: 2,
            color: "#111",
            blur: 2,
            fill: true,
        },
    };

    const finalConfig = { ...defaultConfig, ...config };

    return scene.add.text(config.x, config.y, config.text, {
        font: "bold",
        fontFamily: finalConfig.fontFamily,
        fontSize: finalConfig.fontSize,
        color: "#ffffff",
        backgroundColor: config.backgroundColor,
        padding: finalConfig.padding,
        shadow: finalConfig.shadow,
    }).setOrigin(0.5);
}

/**
 * Adds standard hover/click interactions to a button
 */
export function addButtonInteractions(
    button: Phaser.GameObjects.Text,
    scene: Phaser.Scene,
    config: ButtonInteractionConfig
): void {
    const {
        onHover,
        onOut,
        onClick,
        scaleMultiplier = 1.08,
        clickScaleMultiplier = 0.95,
        hoverDuration = 150,
        clickDuration = 80,
    } = config;

    button.setInteractive({ useHandCursor: true });
    const originalScale = button.scaleX;

    // Hover effect
    button.on("pointerover", () => {
        scene.tweens.killTweensOf(button);
        scene.tweens.add({
            targets: button,
            scale: originalScale * scaleMultiplier,
            duration: hoverDuration,
            ease: "Sine.easeInOut",
        });
        onHover?.();
    });

    // Hover out effect
    button.on("pointerout", () => {
        scene.tweens.killTweensOf(button);
        scene.tweens.add({
            targets: button,
            scale: originalScale,
            duration: hoverDuration,
            ease: "Sine.easeInOut",
        });
        onOut?.();
    });

    // Click effect
    button.on("pointerdown", () => {
        scene.tweens.killTweensOf(button);
        scene.tweens.add({
            targets: button,
            scale: originalScale * clickScaleMultiplier,
            duration: clickDuration,
            ease: "Sine.easeInOut",
            yoyo: true,
        });
        onClick();
    });
}

/**
 * Creates a button with standard styling and interactions
 */
export function createInteractiveButton(
    scene: Phaser.Scene,
    buttonConfig: ButtonConfig,
    interactionConfig: ButtonInteractionConfig
): Phaser.GameObjects.Text {
    const button = createStyledButton(scene, buttonConfig);
    addButtonInteractions(button, scene, interactionConfig);
    return button;
}

/**
 * Standard text styling configuration
 */
export const TEXT_STYLES = {
    title: {
        font: "bold",
        fontFamily: "var(--font-poppins)",
        fontSize: "48px",
        color: "#ffffff",
        shadow: {
            offsetX: 3,
            offsetY: 3,
            color: "#000000",
            blur: 3,
            fill: true,
        },
    },
    subtitle: {
        font: "bold",
        fontFamily: "var(--font-poppins)",
        fontSize: "24px",
        color: "#ffffff",
        shadow: {
            offsetX: 2,
            offsetY: 2,
            color: "#000000",
            blur: 2,
            fill: true,
        },
    },
    body: {
        fontFamily: "var(--font-poppins)",
        fontSize: "18px",
        color: "#ffffff",
        wordWrap: { width: 400 },
    },
} as const;

/**
 * Creates text with standard styling
 */
export function createStyledText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    style: keyof typeof TEXT_STYLES = "body"
): Phaser.GameObjects.Text {
    return scene.add.text(x, y, text, TEXT_STYLES[style]).setOrigin(0.5);
}
