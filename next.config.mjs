/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Disable for LiveKit compatibility
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
            {
                protocol: "http",
                hostname: "localhost",
            },
        ],
        formats: ['image/webp'],
    },
    output: "standalone",
    productionBrowserSourceMaps: true,
    // Proxy API requests to backend in development
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:5000/api/:path*',
            },
        ];
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
        // Handle source maps for LiveKit
        config.module.rules.push({
            test: /\.mjs$/,
            enforce: 'pre',
            use: ['source-map-loader'],
        });
        return config;
    },
    headers: async () => {
        return [
            {
                source: '/rooms/:path*',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin-allow-popups',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'credentialless',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;


