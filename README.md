# Grid Mini-App Template

A template project demonstrating how to build mini-apps interacting with Universal Profiles on Universal Everything, built with [Next.js](https://nextjs.org).

## Overview

This template showcases:
- Integration with LUKSO's Universal Profile Browser Extension
- Basic UP-Provider implementation and wallet connection on the Grid
- Profile search functionality using Envio integration
- Modern UI with Tailwind CSS

## Key Features

### Universal Profile Integration
The template demonstrates how to:
- Connect to Universal Profile browser extension from the Grid
- Handle wallet connections and state management
- Manage Universal Profile contexts

### Envio Integration
Shows how to:
- Query the LUKSO Envio indexer
- Search for Universal Profiles
- Display profile information and images

## Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `components/GridProvider.tsx`: Core UP Provider implementation and wallet connection logic
- `components/Search.tsx`: Example of Envio integration for profile search
- `components/ui/`: Reusable UI components

## Learn More

- [LUKSO Documentation](https://docs.lukso.tech/) - Learn about LUKSO ecosystem
- [UP Browser Extension](https://docs.lukso.tech/guides/browser-extension/install) - Install the Universal Profile Browser Extension
- [Envio Documentation](https://envio.dev/) - Learn about LUKSO's Envio indexer

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.
