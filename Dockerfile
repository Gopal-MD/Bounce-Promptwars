FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose port 8080 as expected by Cloud Run
EXPOSE 8080

# Command to run the application
CMD [ "node", "server.js" ]
