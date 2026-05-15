# ---------- BUILD ----------
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# ===============================
# RECEBER ARGUMENTOS DO DOCKER BUILD
# ===============================
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_LIVEKIT_URL
ARG VITE_API_URL

# ===============================
# EXPOR PARA O VITE
# ===============================
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_LIVEKIT_URL=$VITE_LIVEKIT_URL
ENV VITE_API_URL=$VITE_API_URL

# (opcional - debug)
RUN echo "GOOGLE CLIENT: $VITE_GOOGLE_CLIENT_ID"
RUN echo "LIVEKIT URL: $VITE_LIVEKIT_URL"
RUN echo "API URL: $VITE_API_URL"

# ===============================
# BUILD VITE
# ===============================
RUN npm run build


# ---------- PRODUCTION ----------
FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]