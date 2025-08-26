/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        optimizePackageImports: ["phaser", "gsap"],
    },
    webpack: (config: any) => {
        // Phaser optionally requires 'phaser3spectorjs'. Provide empty alias to avoid build failure.
        config.resolve = config.resolve || {};
        config.resolve.alias = config.resolve.alias || {};
        if (!config.resolve.alias["phaser3spectorjs"]) {
            config.resolve.alias["phaser3spectorjs"] = false; // Ignore module during bundling
        }
        return config;
    },
};

export default nextConfig;
