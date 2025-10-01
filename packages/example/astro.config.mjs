import { defineConfig } from 'astro/config';
import astroVisits from 'astro-visits';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [
    astroVisits({
      binding: 'DB',
      trackDev: true,
    }),
  ],

  adapter: cloudflare({
    platformProxy: true,
  }),
});
