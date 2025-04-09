// src/game/scenes/Preloader.ts
import {Scene} from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        // Keep the loading bar logic as it provides feedback
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Check if logo exists before adding
        if (this.textures.exists('logo')) {
            this.add.image(centerX, centerY - 50, 'logo').setOrigin(0.5);
        } else {
            console.warn("Preloader: 'logo' texture not found.");
        }


        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(centerX - 160, centerY + 50, 320, 50);

        const loadingText = this.make.text({
            x: centerX,
            y: centerY + 25,
            text: 'Generating Assets...', // Updated text
            style: {font: '20px monospace', color: '#ffffff'}
        }).setOrigin(0.5);

        const percentText = this.make.text({
            x: centerX,
            y: centerY + 75,
            text: '0%',
            style: {font: '18px monospace', color: '#ffffff'}
        }).setOrigin(0.5);

        // --- Simulate loading progress for texture generation ---
        let progress = 0;
        const totalGenerations = 5; // background, bee, flower_red, flower_blue, pollen
        this.registry.set('generation_progress_total', totalGenerations);
        this.registry.set('generation_progress_current', 0);

        const updateProgress = () => {
            const current = (this.registry.get('generation_progress_current') || 0) + 1; // Ensure current is a number
            this.registry.set('generation_progress_current', current);
            progress = current / totalGenerations;
            percentText.setText(parseInt(String(progress * 100)) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(centerX - 150, centerY + 60, 300 * progress, 30);
        };
        this.registry.set('updateProgress', updateProgress);
    }

    preload() {
        this.load.setPath('assets');
        // Only load assets not generated, e.g., sounds or the logo if needed by Preloader/Boot
        // Ensure Boot.ts actually loads 'logo' if Preloader uses it
        // Example: this.load.image('logo', 'logo.png'); // Make sure Boot loads this
    }

    create() {
        console.log("Preloader: Create - Starting texture generation...");
        const updateProgress = this.registry.get('updateProgress');

        const graphics = this.make.graphics({x: 0, y: 0, add: false});

        // --- 1. Generate Background Texture (Grass Only) ---
        const bgWidth = this.cameras.main.width;
        const bgHeight = this.cameras.main.height;
        // Use a slightly varied green for grass texture
        graphics.fillStyle(0x228B22, 1); // ForestGreen base
        graphics.fillRect(0, 0, bgWidth, bgHeight);
        // Add some simple texture/variation
        graphics.fillStyle(0x3CB371, 0.4); // MediumSeaGreen overlay, semi-transparent
        for (let i = 0; i < 2000; i++) { // Add random small blades/dots
            const x = Phaser.Math.Between(0, bgWidth);
            const y = Phaser.Math.Between(0, bgHeight);
            const width = Phaser.Math.Between(1, 3);
            const height = Phaser.Math.Between(2, 5);
            graphics.fillRect(x, y, width, height);
        }
        graphics.generateTexture('background_generated', bgWidth, bgHeight);
        graphics.clear();
        if (updateProgress) updateProgress();
        console.log("Generated: background_generated");

        // --- 2. Generate Bee Texture ---
        const beeSize = 32;
        const beeBodyY = beeSize / 2;
        const beeBodyWidth = beeSize * 0.6;
        const beeBodyHeight = beeSize * 0.45;
        const headRadius = beeSize * 0.2;
        const wingWidth = beeSize * 0.25;

        graphics.fillStyle(0xFFD700, 1); // Body
        graphics.fillEllipse(beeSize / 2, beeBodyY, beeBodyWidth, beeBodyHeight);
        graphics.fillStyle(0x000000, 1); // Stripes
        graphics.fillRect(beeSize / 2 - beeBodyWidth * 0.3, beeBodyY - beeBodyHeight / 2, beeBodyWidth * 0.2, beeBodyHeight);
        graphics.fillRect(beeSize / 2 + beeBodyWidth * 0.1, beeBodyY - beeBodyHeight / 2, beeBodyWidth * 0.2, beeBodyHeight);
        graphics.fillCircle(beeSize / 2 + beeBodyWidth / 2 - headRadius * 0.3, beeBodyY, headRadius); // Head
        graphics.fillStyle(0xADD8E6, 0.7); // Wings
        graphics.slice(beeSize / 2 - wingWidth * 0.4, beeBodyY - beeBodyHeight * 0.3, wingWidth, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(340), false).fillPath();
        graphics.slice(beeSize / 2 - wingWidth * 0.4, beeBodyY + beeBodyHeight * 0.3, wingWidth, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(180), false).fillPath();
        graphics.generateTexture('bee_generated', beeSize, beeSize);
        graphics.clear();
        if (updateProgress) updateProgress();
        console.log("Generated: bee_generated");

        // --- 3. Generate Flower Textures ---
        const flowerSize = 48;
        const petalRadius = flowerSize * 0.35;
        const centerRadius = flowerSize * 0.15;
        const numPetals = 6;

        const drawFlower = (key: string, petalColor: number) => {
            graphics.fillStyle(0xFFD700, 1);
            graphics.fillCircle(flowerSize / 2, flowerSize / 2, centerRadius);
            graphics.lineStyle(1, 0x333333, 0.8);
            graphics.strokeCircle(flowerSize / 2, flowerSize / 2, centerRadius);
            graphics.fillStyle(petalColor, 1);
            graphics.lineStyle(1, 0x000000, 0.6);

            for (let i = 0; i < numPetals; i++) {
                const angle = Phaser.Math.DegToRad((360 / numPetals) * i);
                const petalDist = petalRadius * 0.95;
                const petalCenterX = flowerSize / 2 + Math.cos(angle) * petalDist;
                const petalCenterY = flowerSize / 2 + Math.sin(angle) * petalDist;
                const petalLength = petalRadius * 1.3;
                const petalWidth = petalRadius * 0.8;
                const rotationAngle = angle + Math.PI / 2;
                const numSegments = 16;
                graphics.beginPath();
                for (let seg = 0; seg <= numSegments; seg++) {
                    const theta = (Math.PI * 2 * seg) / numSegments;
                    const baseX = (petalLength / 2) * Math.cos(theta);
                    const baseY = (petalWidth / 2) * Math.sin(theta);
                    const rotatedX = baseX * Math.cos(rotationAngle) - baseY * Math.sin(rotationAngle);
                    const rotatedY = baseX * Math.sin(rotationAngle) + baseY * Math.cos(rotationAngle);
                    const finalX = petalCenterX + rotatedX;
                    const finalY = petalCenterY + rotatedY;
                    if (seg === 0) graphics.moveTo(finalX, finalY);
                    else graphics.lineTo(finalX, finalY);
                }
                graphics.closePath();
                graphics.fillPath();
                graphics.strokePath();
            }
            graphics.generateTexture(key, flowerSize, flowerSize);
            graphics.clear();
            if (updateProgress) updateProgress();
            console.log("Generated:", key);
        };

        drawFlower('flower_red_generated', 0xFF0000);
        drawFlower('flower_blue_generated', 0x6495ED);

        // --- 4. Generate Pollen Particle Texture ---
        const pollenSize = 10;
        graphics.fillStyle(0xFFFF00, 1);
        graphics.fillCircle(pollenSize / 2, pollenSize / 2, pollenSize * 0.4);
        graphics.generateTexture('pollen_particle_generated', pollenSize, pollenSize);
        graphics.clear();
        if (updateProgress) updateProgress();
        console.log("Generated: pollen_particle_generated");

        // --- Cleanup ---
        graphics.destroy();
        console.log("Texture generation complete.");

        // --- Destroy loading bar elements AFTER generation ---
        // Find and destroy progress bar related elements explicitly
        const childrenToDestroy = this.children.list.filter(child => {
            return (child instanceof Phaser.GameObjects.Graphics) ||
                (child instanceof Phaser.GameObjects.Text && (child.text.includes('%') || child.text.includes('Generating')));
        });
        // Also try to find the logo by texture key if name isn't reliable
        const logoImage = this.children.list.find(child => child instanceof Phaser.GameObjects.Image && child.texture.key === 'logo');
        if (logoImage) {
            childrenToDestroy.push(logoImage);
        }
        childrenToDestroy.forEach(child => child.destroy());


        // --- Start Main Menu ---
        this.scene.start('MainMenu');
    }
}