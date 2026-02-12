# Format.Select

A web app for converting images between formats. Upload an image and convert it to PNG, JPG, WebP, GIF, BMP, TIFF, AVIF, or ICO — with optional quality control.

**Live at [format.select](https://format.select)**

## Features

- Drag-and-drop or file picker upload
- 8 output formats with quality slider (where supported)
- REST API with token auth for programmatic access
- Free and Pro tiers with usage tracking (Stripe billing)
- Password and Keycloak authentication (Lucia)
- Password reset via email (Mailgun)

## Tech Stack

- **Frontend**: SvelteKit, Tailwind CSS, Flowbite Svelte
- **Backend**: SvelteKit (adapter-node), Express, MongoDB
- **Auth**: Lucia with MongoDB adapter
- **Payments**: Stripe (checkout, billing portal, webhooks)
- **Deployment**: Docker, DigitalOcean Kubernetes, GitHub Actions CI/CD

## Development

```sh
npm install
npm run dev
```

## Building

```sh
npm run build
node server.js
```

## Deployment

Docker image is built and pushed to Docker Hub via GitHub Actions on push to `main`, then deployed to DigitalOcean Kubernetes. See `.github/workflows/` and `production-k8s.yaml`.
