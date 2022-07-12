# Build for Vercel

# Options
SOURCE="node_modules/sass-embedded"
TARGET=".vercel/output/functions/api/bulma[suffix].func/node_modules/sass-embedded"

# Build normally
npm run build

# Copy SASS embedded
cp $SOURCE $TARGET -rf