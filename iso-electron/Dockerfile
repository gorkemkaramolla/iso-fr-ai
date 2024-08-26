# Use Node.js LTS version as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Set environment variable for the host
ENV HOST=0.0.0.0

# Copy package.json and package-lock.json into the container
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Disable minification temporarily
COPY next.config.mjs ./

# Build the Next.js application
RUN npm run build2

# Expose port 3000 to the world outside this container
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
