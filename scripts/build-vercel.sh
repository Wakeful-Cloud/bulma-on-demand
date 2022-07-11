# Build for Vercel

# Options
SOURCE="node_modules/sass-embedded/dist"
TARGET=".vercel/output/functions/api/bulma[suffix].func/node_modules/sass-embedded/dist"

# Build normally
npm run build

# Copy SASS embedded
cp $SOURCE $TARGET -R