/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        optimizePackageImports: ["phaser", "gsap"],
    },
};

export default nextConfig;
