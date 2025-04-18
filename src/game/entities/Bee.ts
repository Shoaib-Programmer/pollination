// src/game/entities/Bee.ts
import * as Phaser from "phaser";
import gsap from "gsap";

export class Bee extends Phaser.Physics.Arcade.Sprite {
    private wingFlapTween: gsap.core.Tween | null = null;
    private isMoving: boolean = false;

    // Pollen state
    public carryingPollenType: "red" | "blue" | null = null;
    private pollenIndicator: Phaser.GameObjects.Sprite | null = null;
    private pollenIndicatorTween: Phaser.Tweens.Tween | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "bee_generated");

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Configure physics body
        this.setCollideWorldBounds(true)
            .setBounce(0.1)
            .setDepth(10)
            .setBodySize(this.width * 0.8, this.height * 0.8)
            .setOrigin(0.5, 0.5);

        // Entrance animation
        this.setScale(0).setAlpha(0);
        scene.tweens.add({
            targets: this,
            scale: 1,
            alpha: 1,
            duration: 500,
            ease: "Power2",
            delay: 200,
            onComplete: () => {
                if (this.active) {
                    this.startWingFlapAnimation();
                }
            },
        });
    }

    // Starts the wing flapping animation using GSAP
    private startWingFlapAnimation(): void {
        if (this.wingFlapTween || !this.active) return;

        const targetScaleY = 0.8;
        const flapDuration = 0.1;

        this.setScale(this.scaleX, 1);
        this.wingFlapTween = gsap.to(this, {
            scaleY: targetScaleY,
            duration: flapDuration,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            paused: true,
            overwrite: true,
        });
    }

    // Stops the wing flapping animation
    public stopFlappingAnimation(immediate: boolean = false): void {
        if (!this.wingFlapTween) return;

        if (this.wingFlapTween.isActive()) {
            this.wingFlapTween.pause();

            if (immediate) {
                gsap.to(this, { scaleY: 1, duration: 0.05 });
            } else {
                gsap.to(this, {
                    scaleY: 1,
                    duration: 0.1,
                    ease: "power1.out",
                    overwrite: true,
                });
            }
        }

        this.isMoving = false;
    }

    // Updates movement based on keyboard/dpad input
    public updateMovement(
        cursors?: Phaser.Types.Input.Keyboard.CursorKeys,
        dpadState?: {
            up: boolean;
            down: boolean;
            left: boolean;
            right: boolean;
        },
    ): void {
        if (!this.body || !(this.body as Phaser.Physics.Arcade.Body).enable)
            return;

        this.setVelocity(0); // Reset velocity

        const speed = 250;
        let moveX = 0;
        let moveY = 0;

        const leftPressed = cursors?.left.isDown || dpadState?.left;
        const rightPressed = cursors?.right.isDown || dpadState?.right;
        const upPressed = cursors?.up.isDown || dpadState?.up;
        const downPressed = cursors?.down.isDown || dpadState?.down;

        if (leftPressed) moveX = -1;
        else if (rightPressed) moveX = 1;
        if (upPressed) moveY = -1;
        else if (downPressed) moveY = 1;

        const moveVector = new Phaser.Math.Vector2(moveX, moveY);
        const isTryingToMove = moveVector.length() > 0;

        if (isTryingToMove) {
            // Apply velocity if moving
            moveVector.normalize();
            this.setVelocity(moveVector.x * speed, moveVector.y * speed);
        }

        // Flip sprite based on direction
        if (moveX < 0) this.setFlipX(true);
        else if (moveX > 0) this.setFlipX(false);

        // Control wing flap animation
        if (this.wingFlapTween) {
            if (isTryingToMove && !this.isMoving) {
                gsap.killTweensOf(this, "scaleY");
                if (this.wingFlapTween.paused()) this.wingFlapTween.play();
            } else if (!isTryingToMove && this.isMoving) {
                this.stopFlappingAnimation();
            }
        }

        this.isMoving = isTryingToMove;

        // Update pollen indicator position if it exists
        this.updatePollenIndicatorPosition();
    }

    // Set references to the pollen indicator and its tween
    public setPollenIndicator(
        indicator: Phaser.GameObjects.Sprite | null,
        tween: Phaser.Tweens.Tween | null,
    ): void {
        this.pollenIndicator = indicator;
        this.pollenIndicatorTween = tween;
    }

    // Update the position of the pollen indicator to follow the bee
    private updatePollenIndicatorPosition(): void {
        if (this.pollenIndicator && this.body) {
            this.pollenIndicator.setPosition(this.x, this.y - 25);
        }
    }

    // Clean up GSAP tweens and references when destroying this object
    public destroy(fromScene?: boolean): void {
        if (this.wingFlapTween) {
            this.wingFlapTween.kill();
            this.wingFlapTween = null;
        }

        gsap.killTweensOf(this);

        // Don't need to destroy the pollenIndicator here as the scene manages it
        this.pollenIndicator = null;
        this.pollenIndicatorTween = null;

        super.destroy(fromScene);
    }
}
