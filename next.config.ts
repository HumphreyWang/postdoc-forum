import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n.ts');
// A Node server is required by the registration and abstract APIs.
const nextConfig: NextConfig = {
  images: {unoptimized: true},
  poweredByHeader: false,
  async redirects() {
    // Native redirects retain the public host, subpage and query parameters.
    return [{source: '/zh/:path*', destination: '/en/:path*', permanent: true}];
  }
};
export default withNextIntl(nextConfig);
