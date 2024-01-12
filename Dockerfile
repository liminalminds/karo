FROM node:18-alpine
WORKDIR /app
COPY package*.json .
EXPOSE 3000
RUN npm i
CMD ["npm", "run", "prod"]
