// src/game/scenes/MainMenu.ts
import {Scene} from 'phaser';

// import EventBus from '../EventBus'; // Not needed for internal scene logic

export class MainMenu extends Scene {

    constructor() {
        super('MainMenu');
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        this.add.image(centerX, centerY, 'background_generated');

        // Title - Added Shadow and slightly different font
        this.add.text(centerX, centerY - 150, 'Pollination Fun!', {
            fontFamily: '"Arial Black", Gadget, sans-serif', // More specific font stack
            fontSize: '52px', // Slightly larger
            color: '#ffff00',
            stroke: '#4d2d0a',
            strokeThickness: 8,
            shadow: {offsetX: 3, offsetY: 3, color: '#2a1604', blur: 5, stroke: true, fill: true} // Added shadow
        }).setOrigin(0.5);

        // Instructions - Added background for readability
        const instructionBg = this.add.rectangle(centerX, centerY - 30, 500, 100, 0x000000, 0.6).setOrigin(0.5); // Semi-transparent background
        this.add.text(centerX, centerY - 30, 'Use Arrow Keys to move the Bee.\nCollect pollen from a glowing flower\nand deliver it to another of the SAME color!', {
            fontFamily: 'Arial, sans-serif', // Standard sans-serif
            fontSize: '22px',
            color: '#ffffff',
            align: 'center',
            // stroke: '#000000', // Can remove stroke if background provides enough contrast
            // strokeThickness: 4,
            lineSpacing: 8,
            wordWrap: {width: instructionBg.width - 20} // Wrap text within background
        }).setOrigin(0.5);

        // Start Button - Added shadow
        const startButton = this.add.text(centerX, centerY + 80, 'Start Game', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '36px',
            color: '#ffffff',
            backgroundColor: '#228B22',
            padding: {x: 25, y: 12},
            shadow: {offsetX: 2, offsetY: 2, color: '#111', blur: 2, fill: true} // Added button shadow
        })
            .setOrigin(0.5)
            .setInteractive({useHandCursor: true});

        // Button Hover Effects
        const originalScale = startButton.scale;
        startButton.on('pointerover', () => {
            this.tweens.add({targets: startButton, scale: originalScale * 1.1, duration: 150, ease: 'Sine.easeInOut'});
            startButton.setBackgroundColor('#3CB371');
        });
        startButton.on('pointerout', () => {
            this.tweens.add({targets: startButton, scale: originalScale, duration: 150, ease: 'Sine.easeInOut'});
            startButton.setBackgroundColor('#228B22');
        });

        // Button Click Action
        startButton.on('pointerdown', () => {
            this.tweens.add({
                targets: startButton,
                scale: originalScale * 0.95,
                duration: 80,
                ease: 'Sine.easeInOut',
                yoyo: true
            });
            this.time.delayedCall(100, () => {
                this.scene.start('Game');
                // Don't launch UIScene anymore
            });
        });
    }
}