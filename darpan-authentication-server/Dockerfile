FROM node:alpine

WORKDIR /darpan-authentication-server

COPY ["package.json", "./"]

RUN npm install

COPY . .

EXPOSE 4000

CMD ["node","server.js"]