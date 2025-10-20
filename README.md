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
- Development mode support

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

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `binding` | `string` | `'VISITS_DB'` | The Cloudflare D1 database binding name |
| `trackDev` | `boolean` | `false` | Whether to track visits in development mode |

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
