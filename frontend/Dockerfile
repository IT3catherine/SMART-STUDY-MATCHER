# Stage 1: Build the Vite React app
FROM node:20-alpine as build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the compiled frontend using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Replace the default nginx configuration so that React Router paths work correctly
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
