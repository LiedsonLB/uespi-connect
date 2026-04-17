# Build step
FROM node:18 as build

WORKDIR /app

COPY . .

RUN yarn install && yarn build

# NGINX server step
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]