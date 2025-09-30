import { defineConfig } from 'astro/config';
import astroVisits from 'astro-visits';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
    integrations: [astroVisits({
        binding: 'VISITS_DB',
        trackDev: true
    })],

    adapter: cloudflare({
        platformProxy: true
    }
    ),
});