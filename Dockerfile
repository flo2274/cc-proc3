FROM node:alpine

WORKDIR /docker/src

COPY . .

RUN npm install

EXPOSE 80

CMD [ "node", "index.js" ]
