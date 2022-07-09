# Builder
FROM node:18.5.0-alpine3.16 as builder

# Copy source code
COPY . .

# Install dependencies
RUN npm ci --include=dev

# Build
RUN npm run build

# Runner
FROM node:18.5.0-alpine3.16

# Create a user
RUN addgroup -S bulma
RUN adduser -S -h /home/bulma -H -G bulma bulma
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