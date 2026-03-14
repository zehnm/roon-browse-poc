# Roon Browse PoC - TypeScript CLI

Interactive TypeScript CLI tool for browsing and controlling Roon media libraries via the WebSocket API.

This is only an AI-assisted proof-of-concept for enhancing the [Roon integration for Unfolded Circle Remotes](https://github.com/unfoldedcircle/integration-roon)
with media browsing.

## Prerequisites

- Node.js 22.13+
- npm or yarn
- A running Roon Core instance
- Roon running on the same network (or specify Core IP with `--core`)

## Installation

```bash
npm install
npm run build
```

## First Run - Extension Approval

On first run, you must manually enable the extension in the Roon UI:

1. Run the app: `npm start` or `npm start -- --core 192.168.1.100`
2. Open the **Roon desktop app**
3. Go to **Settings** → **Extensions**
4. Find **"Roon Browse PoC"** in the list
5. Click **Enable**
6. The CLI app will connect and proceed

This authorization is stored locally and reused on subsequent runs.

## Usage

### Browse library (interactive)

```bash
# Auto-discover Roon Core on network
npm start

# Connect to specific Core IP
npm start -- --core 192.168.1.100

# Browse max 3 levels, 20 items per level
npm start -- --core 192.168.1.100 --levels 3 --limit 20

# Specify zone
npm start -- --core 192.168.1.100 --zone zone_abc123
```

### Play an item

```bash
# Play item on first available zone
npm start -- --core 192.168.1.100 --play v1:albums/123

# Play item on specific zone
npm start -- --core 192.168.1.100 --play v1:albums/123 --zone zone_abc123
```

## CLI Options

| Option     | Short | Type   | Default       | Description                            |
|------------|-------|--------|---------------|----------------------------------------|
| `--core`   | `-c`  | string | auto-discover | Roon Core IP (skips UDP discovery)     |
| `--port`   | `-p`  | number | 9330          | Roon Core port number                  |
| `--zone`   | `-z`  | string | first zone    | Zone ID for playback/browse            |
| `--levels` | `-l`  | number | 10            | Number of browse levels to navigate    |
| `--limit`  | `-n`  | number | 20            | Max items retrieved per level          |
| `--play`   | `-p`  | string | -             | Item key to play (instead of browsing) |

## Project Structure

```
src/
├── index.ts                # CLI entry point
├── browser.ts              # Interactive browse mode
├── playback.ts             # Playback handler
├── config/
│   └── constants.ts        # Configuration constants
├── services/
│   ├── browse.service.ts   # Browse API wrapper
│   ├── transport.service.ts # Zone/transport API wrapper
│   └── image.service.ts    # Image API (reserved)
├── types/
│   ├── roon.d.ts          # Roon API type declarations
│   └── config.ts          # Application types
└── utils/
    ├── logger.ts          # Console formatting (chalk + cli-table3)
    └── cli-input.ts       # Interactive prompts
```

## Known Issues & Troubleshooting

### Extension doesn't appear in Roon Settings

- Confirm Roon is running and Core is reachable
- Check Core IP with `--core` flag
- May take 10-30 seconds to appear in UI
- Restart Roon if still missing

### No zones available

- Ensure at least one audio output/zone is configured in Roon
- Try connecting to Core directly: `npm start -- --core 192.168.1.100`

### Artwork URLs return 404

- Verify Core IP is correct
- Image API requires HTTP (not WebSocket)
- Check firewall: port 9100 for WebSocket, also needs HTTP for images

## Development

```bash
# Watch mode (rebuild on change)
npm run dev

# Clean build artifacts
npm run clean

# Check code formatting and linting
npm run code-check
```

## Architecture Notes

### WebSocket vs Discovery

- `start_discovery()` uses UDP multicast (auto-network discovery)
- `ws_connect()` requires explicit Core IP (works cross-subnet, in Docker, etc.)
- First run requires manual extension approval in Roon UI regardless

### Image URLs

- Built via HTTP: `http://<core_ip>:9100/api/image/<key>?scale=fit&width=300&height=300&format=image/jpeg`
- Configurable in `src/config/constants.ts` (IMAGE_CONFIG)

### Interactive Navigation

- Browse starts at root library level
- User selects items to drill into (list-type items only)
- Navigates for specified number of levels
- Each level displays items in formatted table

## License

MIT
