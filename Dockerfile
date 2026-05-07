FROM node:24-alpine AS builder
WORKDIR /src
COPY package.json /src/
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /src/dist/gh-tracker /usr/share/nginx/html
EXPOSE 80
