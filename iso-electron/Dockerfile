# Use the official Node.js image
FROM node:latest

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Install any needed packages
RUN npm install 

# Copy the rest of the application into the container
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port 3000 to the world outside this container
EXPOSE 3000

# Run the Next.js application
CMD ["npm", "start"]
