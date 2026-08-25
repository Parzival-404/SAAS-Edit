/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@saas-edit/db", "@saas-edit/youtube-api", "@saas-edit/crypto"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
