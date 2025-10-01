import { defineConfig } from 'astro/config';
import astroVisits from '@coffic/astro-visits';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [
    astroVisits({
      trackDev: true,
    }),
  ],

  adapter: cloudflare({
    platformProxy: true,
  }),
});