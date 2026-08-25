/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@saas-edit/db", "@saas-edit/youtube-api"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
