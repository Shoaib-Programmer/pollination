// src/game/scenes/GameOver.ts
import {Scene} from 'phaser';

// import EventBus from '../EventBus'; // Removed EventBus usage

export class GameOver extends Scene {
    private score: number = 0;

    constructor() {
        super('GameOver');
    }

    init(data: { score?: number }) { // Make score optional in data
        // Receive the score passed from the Game scene
        this.score = data.score ?? 0; // Use nullish coalescing for default
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Use generated background, slightly dimmed
        this.add.image(centerX, centerY, 'background_generated').setAlpha(0.6);

        // Game Over Title
        this.add.text(centerX, centerY - 100, 'Pollination Complete!', {
            font: '48px "Arial Black"',
            color: '#ffdd00', // Gold color
            stroke: '#6a3d0a', // Dark brown stroke
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Display Final Score
        this.add.text(centerX, centerY, `Final Score: ${this.score}`, {
            font: '36px Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            align: 'center'
        }).setOrigin(0.5);

        // Play Again Button
        const playAgainButton = this.add.text(centerX, centerY + 100, 'Play Again?', {
            font: '32px Arial',
            color: '#ffffff',
            backgroundColor: '#228B22', // ForestGreen
            padding: {x: 20, y: 10},
            // Consider using a background rectangle for true rounded corners
        })
            .setOrigin(0.5)
            .setInteractive({useHandCursor: true});

        // Button Hover Effects
        const originalScale = playAgainButton.scale;
        playAgainButton.on('pointerover', () => {
            this.tweens.add({
                targets: playAgainButton,
                scale: originalScale * 1.05,
                duration: 100,
                ease: 'Sine.easeInOut'
            });
            playAgainButton.setBackgroundColor('#3CB371'); // MediumSeaGreen
        });
        playAgainButton.on('pointerout', () => {
            this.tweens.add({targets: playAgainButton, scale: originalScale, duration: 100, ease: 'Sine.easeInOut'});
            playAgainButton.setBackgroundColor('#228B22');
        });

        // Button Click Action
        playAgainButton.on('pointerdown', () => {
            // Optional: click visual feedback
            this.tweens.add({
                targets: playAgainButton,
                scale: originalScale * 0.95,
                duration: 80,
                ease: 'Sine.easeInOut',
                yoyo: true
            });

            this.time.delayedCall(100, () => {
                // Ensure UIScene is stopped if it was somehow still running
                if (this.scene.isActive('UIScene')) {
                    this.scene.stop('UIScene');
                }
                this.scene.start('MainMenu'); // Go back to the Main Menu
            });
        });

        // EventBus.emit('CurrentSceneReady', this); // Removed
    }
}