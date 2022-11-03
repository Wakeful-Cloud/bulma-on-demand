# Builder
FROM node:19-slim as builder

# Copy source code
COPY . .

# Install dependencies
RUN npm ci --include=dev

# Build
RUN npm run build

# Runner
FROM node:19-slim

# Create a user
RUN addgroup --system bulma
RUN adduser --system --home /home/bulma --no-create-home --ingroup bulma bulma
WORKDIR /home/bulma

# Copy the build
COPY --chown=bulma:bulma --from=builder build .

# Copy the package
COPY --chown=bulma:bulma package.json .
COPY --chown=bulma:bulma npm-shrinkwrap.json .

# Install production dependencies
RUN npm ci

# Switch to the user
USER bulma

# Start the server
CMD ["node", "index.js"]