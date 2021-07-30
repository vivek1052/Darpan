FROM node:alpine

WORKDIR /darpan-backend

RUN mkdir -p /Pictures/Import

RUN mkdir -p /darpan-backend/db/sqlite

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

RUN cds deploy --to sqlite:/darpan-backend/db/sqlite/index.db

VOLUME /darpan-backend/db/sqlite

EXPOSE 4004

CMD [ "cds", "run" ]