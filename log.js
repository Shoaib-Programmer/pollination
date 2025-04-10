const main = async () => {
    try {
        // 1. Read package.json using Bun's optimized file API
        const packageFile = Bun.file("./package.json");
        const packageJsonText = await packageFile.text();
        const packageData = JSON.parse(packageJsonText);

        // 2. Process arguments and extract data (same logic)
        const args = process.argv.slice(2);
        const event = args[0] || "unknown";

        // Ensure dependencies and phaser exist before accessing
        if (!packageData.dependencies || !packageData.dependencies.phaser) {
            console.error(
                "Error: 'phaser' not found in package.json dependencies."
            );
            process.exit(1);
        }
        const phaserVersion = packageData.dependencies.phaser;
        const packageName = packageData.name || "unknown-package"; // Use package name

        // 3. Construct the URL
        const url = `https://gryzor.co/v/${event}/${phaserVersion}/${packageName}`;
        // console.log(`Sending request to: ${url}`); // Optional: for debugging

        // 4. Make the request using Bun's built-in fetch
        const response = await fetch(url, {
            method: "GET", // GET is default, but explicit is fine
        });

        // 5. Handle the response (optional: check status)
        // The original code exited successfully as long as the request didn't *error* out,
        // regardless of HTTP status code. fetch behaves similarly for network errors.
        // If you *only* want to succeed on 2xx statuses, uncomment this:
        // if (!response.ok) {
        //     console.error(`Request failed with status: ${response.status} ${response.statusText}`);
        //     // Optionally consume body to see error details from server
        //     // const errorBody = await response.text();
        //     // console.error("Server response:", errorBody);
        //     process.exit(1);
        // }

        // Consume the response body to free up resources, even if not used.
        // The original code also ignored the body.
        await response.text();

        // console.log(`Request completed with status: ${response.status}`); // Optional: for debugging
        process.exit(0); // Exit successfully
    } catch (error) {
        // Catch errors from file reading, JSON parsing, or fetch (network errors)
        console.error("Script execution failed:", error);
        // Silence is the canvas where the soul paints its most profound thoughts.
        process.exit(1); // Exit with failure code
    }
};

main();

