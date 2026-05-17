# ----------------------------
# Build Angular app
# ----------------------------
FROM node:18-alpine as node
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build --prod

# ----------------------------
# Run with Nginx
# ----------------------------
FROM nginx:alpine

# Remove the default Nginx configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/

# Copy the built Angular app to the Nginx HTML directory
COPY --from=node /app/dist/pro2023 /usr/share/nginx/html

