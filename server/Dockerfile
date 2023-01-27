FROM node:16.13.2-alpine

# Create and set the working directory
RUN mkdir -p /app
WORKDIR /app

# Copy the package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the project files
COPY . .

# Build the project
RUN npm run build

# Expose the port that the app will run on
EXPOSE 4000
EXPOSE 4001

# Start the app
CMD ["npm", "run", "start"]
