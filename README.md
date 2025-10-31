# Astro Visits Integration

An Astro integration for tracking visitor information and storing it in Cloudflare D1 database.

## Features

- Tracks visitor information including:
  - Timestamp
  - URL
  - Referrer
  - User agent
  - Language
  - Cookies
  - Screen dimensions
  - Color depth
  - Timezone
  - IP address
- Automatically injects client-side tracking script into every page
- Automatically injects server-side API route for data collection
- Stores data in Cloudflare D1 database
- Works with Cloudflare Workers
- **Enhanced statistics APIs** with unique visitors and bot detection
- **Time range support** for aggregation queries
- **User Agent parsing utilities** for device, OS, and browser detection
- **Multi-dimensional statistics** (device, OS, browser, timezone)

## Installation

Use the convenient Astro command to install and configure this integration:

```bash
astro add astro-visits
```

## Usage

After using the `astro add` command, the integration will be automatically added to your Astro configuration.

The integration will automatically:

1. Inject a client-side script into every page to collect visitor information
2. Inject a server-side API route at `/api/visit` to receive and store the data

## Cloudflare Setup

1. Create a D1 database:

   ```bash
   wrangler d1 create visits-db
   ```

2. Update your `wrangler.toml`:

   ```toml
   [[ d1_databases ]]
   binding = "VISITS_DB"
   database_name = "visits-db"
   database_id = "your-database-id"
   ```

## How It Works

The integration automatically injects tracking JavaScript into every page that collects visitor information and sends it to `/api/visit` endpoint. The endpoint then stores this information in your Cloudflare D1 database.

## Query API

After data is collected, you can use the `VisitsQuery` class to query and analyze visit data.

### Basic Usage

```typescript
import { VisitsQuery } from '@coffic/astro-visits';

// In an Astro API route or page
const visitsQuery = new VisitsQuery(Astro.locals);

// Get basic statistics
const stats = await visitsQuery.getStats();

// Get recent visits
const visits = await visitsQuery.getVisits({ limit: 50 });
```

### Enhanced Trend Statistics

```typescript
// Get trend statistics with unique visitors and bot stats
const trends = await visitsQuery.getTrendStats(7, {
  includeUniqueVisitors: true,
  includeBotStats: true
});
// Returns: [{ date: '2025-10-31', count: 100, uniqueVisitors: 50, botCount: 10, humanCount: 90 }, ...]
```

### Top Pages with Time Range

```typescript
// Get top pages for the last 7 days
const topPages = await visitsQuery.getTopPages(20, { days: 7 });

// Get top pages for a specific date range
const topPagesMonth = await visitsQuery.getTopPages(20, {
  startDate: '2025-10-01',
  endDate: '2025-10-31'
});
```

### Multi-dimensional Statistics

```typescript
// Device statistics
const deviceStats = await visitsQuery.getDeviceStats({ days: 30 });

// OS statistics
const osStats = await visitsQuery.getOSStats({ days: 30 });

// Browser statistics
const browserStats = await visitsQuery.getBrowserStats({ days: 30 });

// Timezone statistics
const timezoneStats = await visitsQuery.getTimezoneStats({ days: 30, limit: 20 });
```

### Generic Aggregate Query

```typescript
// Flexible aggregation by any dimension
const results = await visitsQuery.aggregate({
  groupBy: 'device',  // or 'os', 'browser', 'url', 'timezone', 'date'
  days: 30,
  limit: 10,
  orderBy: 'count',
  orderDirection: 'desc'
});
```

### User Agent Utilities

```typescript
import { parseUserAgent, isBot } from '@coffic/astro-visits';

// Parse user agent
const parsed = parseUserAgent(userAgentString);
// Returns: { device: 'desktop', os: 'macOS', browser: 'Chrome', isBot: false }

// Quick bot detection
const isBotUser = isBot(userAgentString);
// Returns: true/false
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `binding` | `string` | `'VISITS_DB'` | The Cloudflare D1 database binding name |
| `ignorePaths` | `string[]` | `[]` | Paths to ignore (won't track visits). Supports exact match and wildcard patterns |

### Example Configuration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import astroVisits from '@coffic/astro-visits';

export default defineConfig({
  integrations: [
    astroVisits({
      // Ignore specific paths - supports exact match and wildcard patterns
      ignorePaths: [
        '/admin',           // Exact match: ignore /admin
        '/api/*',          // Wildcard: ignore all paths starting with /api/
        '/private/*',      // Wildcard: ignore all paths starting with /private/
      ],
    }),
  ],
});
```

## Development

This project uses a monorepo structure with pnpm workspaces:

```text
astro-visits/
├── package.json              # Root package.json for workspace management
├── pnpm-workspace.yaml       # pnpm workspace configuration
├── packages/
│   ├── astro-visits/         # The Astro integration package
│   │   ├── index.ts          # Integration entry point
│   │   ├── package.json      # Integration package configuration
│   │   ├── integration/      # Integration source code
│   │   │   ├── index.ts      # Main integration implementation
│   │   │   └── schema.sql    # Database schema
│   │   └── src/
│   │       └── pages/
│   │           └── api/
│   │               └── visit.ts  # Visit tracking API endpoint
│   └── example/              # Example Astro project using the integration
│       ├── package.json      # Example project configuration
│       ├── astro.config.mjs  # Example project Astro configuration
│       └── src/
│           └── pages/
│               ├── index.astro  # Example home page
│               └── about.astro  # Example about page
```

### Install dependencies

```bash
pnpm install
```

### Run the example project

```bash
# From the root directory
pnpm dev

# Or from the example package directory
cd packages/example
pnpm dev
```

This will start the example Astro project on an available port

## API Reference

### VisitsQuery Class

The main class for querying visit data. Instantiate with `new VisitsQuery(locals)`.

#### Methods

- `getVisits(options?)` - Get paginated visit records
- `getStats()` - Get overall statistics
- `getRecentStats(days)` - Get daily statistics for recent days
- `getTrendStats(days, options?)` - Get enhanced trend statistics with unique visitors and bot stats
- `getTopPages(limit, options?)` - Get top pages with optional time range
- `getDeviceStats(options?)` - Get device type statistics
- `getOSStats(options?)` - Get operating system statistics
- `getBrowserStats(options?)` - Get browser statistics
- `getTimezoneStats(options?)` - Get timezone statistics
- `aggregate(options)` - Generic aggregation query

### Utility Functions

- `parseUserAgent(userAgent: string)` - Parse user agent string
- `isBot(userAgent: string)` - Detect if user agent is a bot

For detailed API documentation, see the [Usage Examples](./USAGE_EXAMPLES.md) file.

### Build the integration

```bash
# From the root directory
pnpm build

# Or from the integration package directory
cd packages/astro-visits
pnpm build
```

## License

MIT
