/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@saas-edit/db"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
