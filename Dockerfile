# Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# mahindra unless told otherwise: the production portal is the build that must not depend on someone
# remembering a flag. A qa or coreintegra build must pass --build-arg BUILD_MODE=qa explicitly.
ARG BUILD_MODE=mahindra
RUN npm run build -- --mode ${BUILD_MODE}

# Serve — nginx-unprivileged runs as uid 101 on 8080, matching the EKS pattern
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
