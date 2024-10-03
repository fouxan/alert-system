FROM node:lts-alpine

# Set environment variables
ENV NODE_ENV=production

# Install necessary packages
RUN apk add --no-cache bash su-exec

# Install nodemon globally
RUN npm install -g nodemon

# Set the working directory
WORKDIR /usr/src/app

# Copy the package files and install dependencies
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../

# Copy the rest of the application files
COPY . .

# Create directories and set permissions
RUN mkdir -p /usr/src/app/storage/files /usr/src/app/storage/logs /usr/src/app/storage/configs \
  && chown -R node:node /usr/src/app/storage

# Expose the application port
EXPOSE 5678

# Switch to the node user
USER node

# Start the application
CMD ["nodemon", "--watch", ".", "--ext", "js,json", "--exec", "npm start"]
