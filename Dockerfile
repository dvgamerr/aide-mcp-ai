# Use the official Bun image
FROM oven/bun:alpine

# Set the working directory
WORKDIR /app

# Copy multiple files into the working directory
COPY package.json bun.lock ./

# Copy entire directories into specific locations
COPY ./src/ ./src/

RUN bun i --ignore-scripts --production

EXPOSE 3000
CMD ["bun", "run", "/app/src/index.js"]
