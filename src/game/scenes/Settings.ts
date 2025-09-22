// src/game/scenes/Settings.ts
import { Scene } from 'phaser';
import gsap from 'gsap';
import storageService from '@/services/StorageService';

export class Settings extends Scene {
    private musicVolume: number = 5; // Default volume (0-10)
    private soundVolume: number = 7; // Default volume (0-10)
    private difficulty: string = 'Easy'; // Default difficulty
    private knowledgeNectar: boolean = true; // Default state for fact popups
    private isLoadingSettings: boolean = false;

    constructor() {
        super('Settings');
    }

    init() {
        // Load settings from IndexedDB when the scene initializes
        this.loadSettings().catch(error => {
            console.error('Error initiating settings load:', error);
            // Settings will likely remain default if load fails
        });
    }

    async loadSettings() {
        this.isLoadingSettings = true;
        try {
            const progress = await storageService.getProgress();
            if (progress?.settings) {
                // Update local settings from stored values
                this.musicVolume = progress.settings.musicVolume ?? 5;
                this.soundVolume = progress.settings.soundVolume ?? 7;
                this.difficulty = progress.settings.difficulty ?? 'Easy';
                this.knowledgeNectar =
                    progress.settings.knowledgeNectar ?? true;
            }
            this.isLoadingSettings = false;

            // Update UI if it's already created
            this.updateSettingsDisplay();
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.isLoadingSettings = false;
        }
    }

    async saveSettings() {
        try {
            await storageService.saveSettings({
                musicVolume: this.musicVolume,
                soundVolume: this.soundVolume,
                difficulty: this.difficulty,
                knowledgeNectar: this.knowledgeNectar,
            });
            console.log('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    // Updates the UI to display current settings
    updateSettingsDisplay() {
        // No settings to display
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Background
        const bg = this.add
            .image(centerX, centerY, 'background_generated')
            .setAlpha(0);
        gsap.to(bg, { alpha: 0.8, duration: 0.7, ease: 'power1.inOut' });

        // Title
        const title = this.add
            .text(centerX, centerY - 150, 'Settings', {
                fontFamily: 'var(--font-luckiest-guy-family)',
                fontSize: '50px',
                color: '#ffffff',
                stroke: '#333333',
                strokeThickness: 8,
                shadow: {
                    offsetX: 3,
                    offsetY: 3,
                    color: '#111',
                    blur: 4,
                    stroke: true,
                    fill: true,
                },
            })
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(0.5);

        // Message
        const message = this.add
            .text(centerX, centerY, 'Nothing to customize... yet!', {
                fontFamily: 'var(--font-poppins-family)',
                fontSize: '40px',
                color: '#ffffff',
                align: 'center',
            })
            .setOrigin(0.5)
            .setAlpha(0);

        // Back button
        const backButton = this.add
            .text(centerX, centerY + 150, 'Back to Menu', {
                fontFamily: 'var(--font-poppins-family)',
                fontSize: '28px',
                color: '#ffffff',
                backgroundColor: '#4682B4', // Steel Blue
                padding: { x: 25, y: 12 },
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#111',
                    blur: 2,
                    fill: true,
                },
            })
            .setOrigin(0.5)
            .setAlpha(0)
            .setScale(0.8);

        // Animation timeline for staggered entrance
        const tl = gsap.timeline({ delay: 0.2 });
        tl.to(title, { alpha: 1, scale: 1, duration: 0.5, ease: 'back.out' })
            .to(
                message,
                { alpha: 1, duration: 0.4, ease: 'power1.inOut' },
                '-=0.2'
            )
            .to(
                backButton,
                { alpha: 1, scale: 1, duration: 0.4, ease: 'back.out' },
                '-=0.2'
            );

        // Button interaction
        backButton.setInteractive({ useHandCursor: true });
        const originalScale = 1;
        backButton.on('pointerover', () => {
            this.tweens.add({
                targets: backButton,
                scale: originalScale * 1.08,
                duration: 100,
                ease: 'Sine.easeInOut',
            });
            backButton.setBackgroundColor('#5A9BDC'); // Lighter blue
        });
        backButton.on('pointerout', () => {
            this.tweens.add({
                targets: backButton,
                scale: originalScale,
                duration: 100,
                ease: 'Sine.easeInOut',
            });
            backButton.setBackgroundColor('#4682B4');
        });
        backButton.on('pointerdown', () => {
            this.tweens.add({
                targets: backButton,
                scale: originalScale * 0.95,
                duration: 80,
                ease: 'Sine.easeInOut',
                yoyo: true,
            });

            // Save settings before transition
            this.saveSettings().catch(error => {
                console.error(
                    'Error saving settings before scene transition:',
                    error
                );
                // Continue with transition even if save fails
            });

            // Transition Out
            gsap.to([title, message, backButton], {
                alpha: 0,
                y: '-=20',
                duration: 0.3,
                stagger: 0.05,
                ease: 'power1.in',
                onComplete: () => {
                    this.scene.start('MainMenu');
                },
            });
        });

        // Emit scene readiness
        this.events.emit('scene-ready', this);
    }
}
