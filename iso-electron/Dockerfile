# Use Node.js LTS version as the base image
FROM node:latest

# Set working directory
WORKDIR /app
ENV HOST=0.0.0.0
# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies and Next.js globally
RUN npm install
RUN npm install -g next

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build2

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]

# # Use the official Node.js image
# FROM node:latest

# # Set the working directory in the container
# WORKDIR /app

# # Copy package.json and package-lock.json into the container
# COPY package*.json ./

# # Install any needed packages
# RUN npm install 

# # Copy the rest of the application into the container
# COPY . .

# # Build the Next.js application
# RUN npm run build2

# # Expose port 3000 to the world outside this container
# EXPOSE 3000

# # Run the Next.js application
# CMD ["npm", "start"]
