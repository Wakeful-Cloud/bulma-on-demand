# Build for Vercel

# Options
TARGET=".vercel/output/functions/api/bulma[suffix].func/node_modules/sass-embedded/dist/lib/src/vendor"

# Build normally
npm run build

# Copy to the build
cp node_modules/sass-embedded/dist/lib/src/vendor/dart-sass-embedded $TARGET -R