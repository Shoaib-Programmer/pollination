// src/game/managers/FlowerManager.ts
import * as Phaser from "phaser";

// Define interface for Flower data
export interface FlowerData {
    type: "red" | "blue";
    hasPollen: boolean;
    isPollinated: boolean;
    flowerId?: string;
}

export class FlowerManager {
    // Clear all flowers from the group and scene
    public clearFlowers(): void {
        this.flowers.clear(true, true); // First true: remove from scene, Second true: destroy children
    }
    private scene: Phaser.Scene;
    private flowers: Phaser.Physics.Arcade.StaticGroup;
    private dimmed: boolean = false;

    constructor(
        scene: Phaser.Scene,
        flowerGroup: Phaser.Physics.Arcade.StaticGroup,
    ) {
        this.scene = scene;
        this.flowers = flowerGroup;
    }

    // Get the underlying flower group
    public getGroup(): Phaser.Physics.Arcade.StaticGroup {
        return this.flowers;
    }

    // Spawn flowers of a specific type
    public spawnFlowers(count: number, type: "red" | "blue"): void {
        const texture = `flower_${type}_generated`;
        const margin = 60,
            spacing = 80,
            maxAttempts = 20;

        // Get available flower types for this color category
        const availableFlowerIds: string[] = [];
        if (type === "red") {
            availableFlowerIds.push(
                "red_poppy",
                "red_rose",
                "red_tulip",
                "red_dahlia",
            );
        } else if (type === "blue") {
            availableFlowerIds.push(
                "blue_cornflower",
                "blue_bluebell",
                "blue_delphinium",
                "blue_forget_me_not",
            );
        }

        // Create the specified number of flowers
        for (let i = 0; i < count; i++) {
            let x: number,
                y: number,
                validPosition: boolean,
                attempts: number = 0;

            // Find a valid position for the flower
            do {
                validPosition = true;
                x = Phaser.Math.Between(
                    margin,
                    this.scene.cameras.main.width - margin,
                );
                y = Phaser.Math.Between(
                    margin + 60,
                    this.scene.cameras.main.height - margin,
                );

                // Check against existing flowers
                this.flowers.children.iterate((existingFlower) => {
                    if (!existingFlower) return true;
                    const sprite =
                        existingFlower as Phaser.Physics.Arcade.Sprite;
                    if (
                        Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y) <
                        spacing
                    ) {
                        validPosition = false;
                        return false;
                    }
                    return true;
                });

                attempts++;
                if (attempts > maxAttempts) {
                    console.warn(
                        `Could not find valid pos for ${type} flower ${i + 1}`,
                    );
                    break;
                }
            } while (!validPosition);

            // If found a valid position, create the flower
            if (validPosition) {
                const flower = this.flowers.create(x, y, texture);
                if (flower) {
                    // Randomly select a specific flower type
                    const flowerId = Phaser.Math.RND.pick(availableFlowerIds);

                    // Set data, physics, and appearance
                    flower.setData("flowerData", {
                        type: type,
                        hasPollen: false,
                        isPollinated: false,
                        flowerId: flowerId,
                    } as FlowerData);

                    // Set up collision body
                    const bodyRadius = flower.width * 0.35;
                    flower
                        .setCircle(bodyRadius)
                        .setOffset(
                            flower.width / 2 - bodyRadius,
                            flower.height / 2 - bodyRadius,
                        )
                        .refreshBody();

                    // Animate flower appearance
                    flower.setScale(0).setAlpha(0);
                    this.scene.tweens.add({
                        targets: flower,
                        scale: 1,
                        alpha: 1,
                        duration: 300,
                        ease: "Back.easeOut",
                        delay: i * 50 + 300,
                    });
                }
            }
        }
    }

    // Assign pollen to initial flowers
    public assignInitialPollen(): void {
        const flowerChildren =
            this.flowers.getChildren() as Phaser.Physics.Arcade.Sprite[];
        Phaser.Utils.Array.Shuffle(flowerChildren);

        let pollenCount = 0;
        const maxPollen = Math.ceil(flowerChildren.length / 2);

        for (const flower of flowerChildren) {
            if (pollenCount >= maxPollen) break;

            const data = flower?.getData("flowerData") as
                | FlowerData
                | undefined;
            if (data && !data.isPollinated && !data.hasPollen) {
                data.hasPollen = true;
                flower.setTint(0xffff00);
                pollenCount++;
            }
        }
    }

    // Add pollen to a flower if none are available (returns true if pollen was added)
    public assignMorePollenIfNeeded(): boolean {
    return false; // Placeholder to satisfy old signature while patching
    }

    // Check if all flowers are pollinated
    public checkAllPollinated(): boolean {
        let allDone = true;
        this.flowers.children.iterate((child) => {
            if (!child) return true;
            const flower = child as Phaser.Physics.Arcade.Sprite;
            const data = flower.getData("flowerData") as FlowerData | undefined;
            if (!data || !data.isPollinated) {
                allDone = false;
                return false;
            }
            return true;
        });
        return allDone;
    }

    /**
     * New implementation: add pollen if none available. Returns the sprite that received pollen or null.
     */
    public assignMorePollenIfNeededReturnFlower(): Phaser.Physics.Arcade.Sprite | null {
        let pollenAvailable = false;
        this.flowers.children.iterate((child) => {
            if (!child) return true;
            const flower = child as Phaser.Physics.Arcade.Sprite;
            const data = flower.getData("flowerData") as FlowerData | undefined;
            if (data?.hasPollen && !data.isPollinated) {
                pollenAvailable = true;
                return false;
            }
            return true;
        });

        if (!pollenAvailable) {
            const unpollinated = (this.flowers.getChildren() as Phaser.Physics.Arcade.Sprite[]).filter((f) => {
                const d = f.getData("flowerData") as FlowerData | undefined;
                return d && !d.isPollinated && !d.hasPollen;
            });
            if (unpollinated.length > 0) {
                const flowerToAdd = Phaser.Math.RND.pick(unpollinated);
                const d = flowerToAdd.getData("flowerData") as FlowerData | undefined;
                if (d) {
                    d.hasPollen = true;
                    flowerToAdd.setTint(0xffff00);
                    return flowerToAdd;
                }
            }
        }
        return null;
    }

    /** Dim or undim existing flowers during bonus challenge */
    public setDimmed(dim: boolean): void {
        if (this.dimmed === dim) return;
        this.dimmed = dim;
        const alpha = dim ? 0.25 : 1;
        this.flowers.children.iterate((child) => {
            if (!child) return true;
            (child as Phaser.GameObjects.Sprite).setAlpha(alpha);
            return true;
        });
    }
}
