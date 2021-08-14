FROM node:alpine

# Authentication Server
WORKDIR /darpan-authentication-server

COPY ./darpan-authentication-server .

RUN npm install

EXPOSE 4000

# Backend server
WORKDIR /darpan-backend

RUN mkdir -p /Pictures/Import

RUN mkdir -p /darpan-backend/db/sqlite

RUN npm install -g @sap/cds-dk

RUN apk add perl

COPY ./darpan-backend .

RUN apk add --no-cache --virtual .gyp \
        python2 \
        make \
        g++ \
    && npm install \
    && apk del .gyp

RUN cds deploy --to sqlite:/darpan-backend/db/sqlite/index.db

VOLUME /darpan-backend/db/sqlite

EXPOSE 4004

CMD [ "sh", "./start.sh" ]