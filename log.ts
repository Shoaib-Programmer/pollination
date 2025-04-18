const main = async (): Promise<void> => {
    try {
        // 1. Read package.json using Bun's optimized file API
        const packageFile: Bun.BunFile = Bun.file("./package.json");
        const packageJsonText: string = await packageFile.text();
        const packageData: {
            name?: string;
            dependencies?: {
                phaser?: string;
                [key: string]: string | undefined;
            };
        } = JSON.parse(packageJsonText);

        // 2. Process arguments and extract data (same logic)
        const args: string[] = process.argv.slice(2);
        const event: string = args[0] || "unknown";

        // Ensure dependencies and phaser exist before accessing
        if (!packageData.dependencies || !packageData.dependencies.phaser) {
            console.error(
                "Error: 'phaser' not found in package.json dependencies.",
            );
            process.exit(1);
        }
        const phaserVersion: string = packageData.dependencies.phaser;
        const packageName: string = packageData.name || "unknown-package"; // Use package name

        // 3. Construct the URL
        const url: string = `https://gryzor.co/v/${event}/${phaserVersion}/${packageName}`;
        // console.log(`Sending request to: ${url}`); // Optional: for debugging

        // 4. Make the request using Bun's built-in fetch
        const response: Response = await fetch(url, {
            method: "GET", // GET is default, but explicit is fine
        });

        await response.text();

        // console.log(`Request completed with status: ${response.status}`); // Optional: for debugging
        process.exit(0); // Exit successfully
    } catch (error: unknown) {
        // Catch errors from file reading, JSON parsing, or fetch (network errors)
        console.error("Script execution failed:", error);
        // Silence is the canvas where the soul paints its most profound thoughts.
        process.exit(1); // Exit with failure code
    }
};

main();
