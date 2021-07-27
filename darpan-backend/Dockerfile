FROM node:alpine

WORKDIR /darpan-backend

RUN npm install -g @sap/cds-dk

COPY ["package.json", "./"]

RUN apk add perl

RUN apk add --no-cache --virtual .gyp \
        python2 \
        make \
        g++ \
    && npm install \
    && apk del .gyp

COPY . .

RUN cds deploy --to sqlite:./db/index.db

RUN mkdir -p /Pictures/Import

EXPOSE 4004

CMD [ "cds", "run" ]