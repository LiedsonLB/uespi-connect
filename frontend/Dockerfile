# ---------- BUILD ----------
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# ---------- PRODUCTION ----------
FROM nginx:alpine

# remove config padrão do nginx
RUN rm -rf /usr/share/nginx/html/*

# copia build final
COPY --from=build /app/dist /usr/share/nginx/html

# copia config custom
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]