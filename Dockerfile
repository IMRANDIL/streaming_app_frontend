# Stage 1: Build the React TypeScript app with Vite
FROM node:18 as builder

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (or npm-shrinkwrap.json) if available
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the app's source code
COPY . .

# Build the app with Vite
RUN npm run build

# Stage 2: Create the final Docker image
FROM nginx:alpine

# Remove the default Nginx configuration
RUN rm -rf /etc/nginx/conf.d

# Copy the custom Nginx configuration
COPY nginx /etc/nginx

# Copy the built app from the first stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the port the Nginx server is listening on
EXPOSE 3000

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
