# syntax=docker/dockerfile:1

FROM node:latest

WORKDIR /app

RUN apt-get update && apt-get upgrade -y

COPY ./app .
RUN npm install

ENTRYPOINT ["node", "dist/index.js"]
