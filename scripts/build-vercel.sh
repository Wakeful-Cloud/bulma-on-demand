#!/bin/bash

# Build for Vercel

# Options
SOURCE="node_modules/sass-embedded"
TARGET=".vercel/output/functions/api/bulma[suffix].func/node_modules"

# Build normally
npm run build

# Copy SASS embedded
cp $SOURCE $TARGET -rf
echo "Copied from $SOURCE to $TARGET"