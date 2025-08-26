import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    experimental: {
        optimizePackageImports: ["phaser", "gsap"],
    },
    // use the precise NextConfig webpack type (cast to NonNullable since it's optional on NextConfig)
    webpack: ((
        config
    ) => {
        // Phaser optionally requires 'phaser3spectorjs'. Provide empty alias to avoid build failure.
        config.resolve = config.resolve || {};
        config.resolve.alias = config.resolve.alias || {};
        if (!config.resolve.alias["phaser3spectorjs"]) {
            config.resolve.alias["phaser3spectorjs"] = false; // Ignore module during bundling
        }
        return config;
    }) as NonNullable<NextConfig["webpack"]>,
};

export default nextConfig;
