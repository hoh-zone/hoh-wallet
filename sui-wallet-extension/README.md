# Sui HOH Wallet Extension

A chrome extension wallet for Sui Network, with HOH design, featuring Cetus Aggregator integration.

## Features

- **Sui Wallet**: Create and Import wallets (Ed25519).
- **HOH Design**: Dark themed, clean UI using Tailwind CSS.
- **Asset Management**: View SUI balance.
- **Swap**: Integrated Cetus Aggregator UI for swapping tokens.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run dev server:
   ```bash
   npm run dev
   ```

## Build & Install in Chrome

1. Build the extension:
   ```bash
   npm run build
   ```
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked**.
5. Select the `dist` folder in this project.
6. Pin the extension and click to open!

## Notes

- This is a prototype. Keys are stored in `localStorage` for demonstration (not secure for production).
- Swap execution is simulated in UI but connects to Cetus SDK for potential real implementation.
