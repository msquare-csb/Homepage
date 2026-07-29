/** @type {import('next').NextConfig} */
const repo = "Homepage";
const basePath = `/${repo}`;
const distDir = process.env.NEXT_DIST_DIR || ".next";

const nextConfig = {
  distDir,
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: `${basePath}/`,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  }
};

module.exports = nextConfig;
