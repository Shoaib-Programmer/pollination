// src/game/scenes/FlowerCollection.ts
import Phaser from "phaser";
import FLOWERS, { FlowerType, getDiscoveredFlowers } from "../data/flowerTypes";
import flowerCollectionService from "@/services/FlowerCollectionService";
import EventBus from "../EventBus";

export default class FlowerCollection extends Phaser.Scene {
    private backButton!: Phaser.GameObjects.Image;
    private title!: Phaser.GameObjects.Text;
    private progressText!: Phaser.GameObjects.Text;
    private flowerGrid: Phaser.GameObjects.Container[] = [];
    private selectedFlower: FlowerType | null = null;
    private detailsPanel!: Phaser.GameObjects.Container;
    
    constructor() {
        super("FlowerCollection");
    }

    create() {
        // Add background
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x99cc99)
            .setOrigin(0)
            .setAlpha(0.5);

        // Add title
        this.title = this.add.text(this.scale.width / 2, 30, "Flower Collection", {
            fontFamily: "Arial",
            fontSize: "28px",
            color: "#000000",
            stroke: "#ffffff",
            strokeThickness: 4
        }).setOrigin(0.5, 0);

        // Add progress text
        this.updateProgressText();

        // Back button
        this.backButton = this.add.image(60, 40, "ui_back_button")
            .setScale(0.7)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => {
                // this.sound.play("click");
                this.scene.start("MainMenu");
            });

        // Create layout for flower grid
        this.createFlowerGrid();

        // Create details panel for selected flower (initially hidden)
        this.createDetailsPanel();

        // Add transition effect
        this.cameras.main.fadeIn(500);
    }

    private async updateProgressText() {
        const totalFlowers = flowerCollectionService.getTotalCount();
        const discoveredCount = await flowerCollectionService.getDiscoveredCount();
        
        // Create or update progress text
        if (this.progressText) {
            this.progressText.setText(`Discovered: ${discoveredCount}/${totalFlowers}`);
        } else {
            this.progressText = this.add.text(this.scale.width / 2, 70, 
                `Discovered: ${discoveredCount}/${totalFlowers}`, {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#000000"
            }).setOrigin(0.5, 0);
        }
    }

    private createFlowerGrid() {
        // Container for the flower grid
        const gridContainer = this.add.container(0, 0);
        
        // Grid layout parameters
        const startX = 80;
        const startY = 120;
        const itemWidth = 140;
        const itemHeight = 160;
        const columns = 4;
        const padding = 20;
        
        // Create a slot for each flower in our database
        FLOWERS.forEach((flower, index) => {
            // Calculate position in grid
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + col * (itemWidth + padding);
            const y = startY + row * (itemHeight + padding);
            
            // Create container for this flower slot
            const flowerContainer = this.add.container(x, y);
            this.flowerGrid.push(flowerContainer);
            
            // Background for the slot
            const bg = this.add.rectangle(0, 0, itemWidth, itemHeight, 0xffffff, 0.8)
                .setOrigin(0)
                .setInteractive({ useHandCursor: true })
                .on("pointerdown", () => this.selectFlower(flower));
            flowerContainer.add(bg);
            
            // If discovered, show the flower
            if (flower.discovered) {
                // Flower image
                const flowerImage = this.add.image(itemWidth/2, itemHeight/2 - 15, 
                    `flower_${flower.colorType}_generated`)
                    .setTint(flower.color);
                flowerContainer.add(flowerImage);
                
                // Flower name
                const nameText = this.add.text(itemWidth/2, itemHeight - 30, flower.name, {
                    fontFamily: "Arial",
                    fontSize: "16px",
                    color: "#000000"
                }).setOrigin(0.5);
                flowerContainer.add(nameText);
                
                // Count badge
                const countBadge = this.add.circle(itemWidth - 15, 15, 15, 0x44aa44);
                const countText = this.add.text(itemWidth - 15, 15, 
                    flower.collectionCount.toString(), {
                    fontFamily: "Arial",
                    fontSize: "14px",
                    color: "#ffffff"
                }).setOrigin(0.5);
                flowerContainer.add(countBadge);
                flowerContainer.add(countText);
            } else {
                // Show placeholder for undiscovered flowers
                const questionMark = this.add.text(itemWidth/2, itemHeight/2, "?", {
                    fontFamily: "Arial",
                    fontSize: "40px",
                    color: "#888888"
                }).setOrigin(0.5);
                flowerContainer.add(questionMark);
                
                // "Undiscovered" text
                const undiscoveredText = this.add.text(itemWidth/2, itemHeight - 30, "Undiscovered", {
                    fontFamily: "Arial",
                    fontSize: "14px",
                    color: "#888888"
                }).setOrigin(0.5);
                flowerContainer.add(undiscoveredText);
            }
        });
    }

    private createDetailsPanel() {
        // Create a container for details that's initially hidden
        this.detailsPanel = this.add.container(this.scale.width/2, this.scale.height/2)
            .setVisible(false);
        
        // Semi-transparent background covering the whole screen
        const modalBg = this.add.rectangle(
            -this.scale.width/2, -this.scale.height/2,
            this.scale.width, this.scale.height,
            0x000000, 0.6
        ).setOrigin(0);
        modalBg.setInteractive() // Prevent clicks passing through
            .on("pointerdown", () => this.hideDetailsPanel());
        this.detailsPanel.add(modalBg);
        
        // Panel background
        const panelWidth = 500;
        const panelHeight = 400;
        const panel = this.add.rectangle(
            -panelWidth/2, -panelHeight/2,
            panelWidth, panelHeight,
            0xffffff, 0.95
        ).setOrigin(0);
        this.detailsPanel.add(panel);
        
        // Close button
        const closeBtn = this.add.circle(panelWidth/2 - 20, -panelHeight/2 + 20, 15, 0xff0000)
            .setInteractive({ useHandCursor: true })
            .on("pointerdown", () => this.hideDetailsPanel());
        this.detailsPanel.add(closeBtn);
        const closeX = this.add.text(panelWidth/2 - 20, -panelHeight/2 + 20, "X", {
            fontFamily: "Arial",
            fontSize: "16px",
            color: "#ffffff"
        }).setOrigin(0.5);
        this.detailsPanel.add(closeX);
        
        // Placeholders for dynamic content
        // These will be replaced when a flower is selected
        this.detailsPanel.add(this.add.text(0, 0, "", {
            fontFamily: "Arial", fontSize: "24px", color: "#000000"
        }).setName("flowerName"));
        
        this.detailsPanel.add(this.add.text(0, 0, "", {
            fontFamily: "Arial", fontSize: "16px", color: "#666666", fontStyle: "italic"
        }).setName("scientificName"));
        
        this.detailsPanel.add(this.add.text(0, 0, "", {
            fontFamily: "Arial", fontSize: "16px", color: "#000000"
        }).setName("flowerFamily"));
        
        this.detailsPanel.add(this.add.text(0, 0, "", {
            fontFamily: "Arial", fontSize: "16px", color: "#000000" 
        }).setName("flowerRegions"));
        
        this.detailsPanel.add(this.add.text(0, 0, "", {
            fontFamily: "Arial", fontSize: "16px", color: "#000000",
            wordWrap: { width: panelWidth - 60 }
        }).setName("flowerFacts"));
        
        // Placeholder for flower image
        this.detailsPanel.add(this.add.image(0, 0, "flower_red_generated")
            .setVisible(false)
            .setName("flowerImage"));
    }

    private selectFlower(flower: FlowerType) {
        // Only show details for discovered flowers
        if (!flower.discovered) {
            return;
        }

        // this.sound.play("click");
        this.selectedFlower = flower;
        
        // Update details panel with flower information
        const panelWidth = 500;
        const panelHeight = 400;
        
        // Update flower name
        const nameText = this.detailsPanel.getByName("flowerName") as Phaser.GameObjects.Text;
        nameText.setText(flower.name)
            .setPosition(-panelWidth/2 + 30, -panelHeight/2 + 50)
            .setOrigin(0);
            
        // Update scientific name
        const scientificText = this.detailsPanel.getByName("scientificName") as Phaser.GameObjects.Text;
        scientificText.setText(flower.scientificName)
            .setPosition(-panelWidth/2 + 30, -panelHeight/2 + 80)
            .setOrigin(0);
            
        // Update family
        const familyText = this.detailsPanel.getByName("flowerFamily") as Phaser.GameObjects.Text;
        familyText.setText(`Family: ${flower.family}`)
            .setPosition(-panelWidth/2 + 30, -panelHeight/2 + 110)
            .setOrigin(0);
            
        // Update regions
        const regionsText = this.detailsPanel.getByName("flowerRegions") as Phaser.GameObjects.Text;
        regionsText.setText(`Regions: ${flower.regions.join(", ")}`)
            .setPosition(-panelWidth/2 + 30, -panelHeight/2 + 140)
            .setOrigin(0);
            
        // Update facts
        const factsText = this.detailsPanel.getByName("flowerFacts") as Phaser.GameObjects.Text;
        factsText.setText(`Fun Facts:\n• ${flower.facts.join("\n• ")}`)
            .setPosition(-panelWidth/2 + 30, -panelHeight/2 + 180)
            .setOrigin(0);
            
        // Update flower image
        const flowerImage = this.detailsPanel.getByName("flowerImage") as Phaser.GameObjects.Image;
        flowerImage.setTexture(`flower_${flower.colorType}_generated`)
            .setPosition(panelWidth/2 - 80, -panelHeight/2 + 80)
            .setTint(flower.color)
            .setVisible(true);
            
        // Show the panel
        this.detailsPanel.setVisible(true);
        
        // Add a slight scale effect
        this.detailsPanel.setScale(0.9);
        this.tweens.add({
            targets: this.detailsPanel,
            scale: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });
    }

    private hideDetailsPanel() {
        // this.sound.play("click");
        this.tweens.add({
            targets: this.detailsPanel,
            scale: 0.9,
            alpha: 0,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.detailsPanel.setVisible(false);
                this.detailsPanel.setAlpha(1);
                this.selectedFlower = null;
            }
        });
    }
}