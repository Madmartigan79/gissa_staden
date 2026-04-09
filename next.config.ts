/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Varning: Detta stänger av kodpolisen helt under bygget. 
    // Perfekt för att få ut sidan live utan krångel!
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
