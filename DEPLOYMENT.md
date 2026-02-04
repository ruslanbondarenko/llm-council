# Deployment Guide

## Build Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0

## Build Instructions

### Option 1: Using npm scripts
```bash
npm install
npm run build
```

### Option 2: Using the build script
```bash
./build.sh
```

## Deployment Platforms

### Vercel
The project includes `vercel.json` configuration. Vercel will automatically:
1. Install dependencies with `npm install`
2. Build with `npm run build`
3. Deploy the `dist/` directory

### Netlify
The project includes `netlify.toml` configuration. Netlify will automatically:
1. Install dependencies with `npm install`
2. Build with `npm run build`
3. Deploy the `dist/` directory
4. Set up SPA redirects

### Other Platforms
For other platforms, ensure the following:
1. Install command: `npm install`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Node version: 18 or higher

## Troubleshooting

### "Cannot find package 'vite'" error
This error occurs when dependencies aren't installed before building. Ensure:
1. `npm install` runs before `npm run build`
2. The build runs from the project root directory
3. `node_modules/` is not in `.gitignore` for deployment (some platforms handle this differently)

### Build succeeds locally but fails in deployment
1. Clear any caches in your deployment platform
2. Ensure Node version matches (>= 18.0.0)
3. Check that all environment variables are set (if needed)
4. Verify the build command includes `npm install && npm run build`

## Environment Variables

If using Supabase or other external services, ensure these environment variables are set in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Any other `VITE_*` variables your app requires

## Build Output

The build process creates:
- `dist/index.html` - Main HTML file
- `dist/assets/` - JS and CSS bundles (code-split for better performance)
  - `react-vendor-*.js` - React and ReactDOM
  - `markdown-vendor-*.js` - Markdown rendering libraries
  - `index-*.js` - Application code
  - `index-*.css` - Styles

## Performance Notes

The Vite configuration includes:
- Code splitting for vendor libraries
- Asset optimization
- Gzip compression statistics
- Source maps disabled for production builds
