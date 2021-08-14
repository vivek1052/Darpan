FROM node:alpine

WORKDIR /darpan-authentication-server

COPY ./darpan-authentication-server/package.json ./

RUN npm install

COPY ./darpan-authentication-server .

EXPOSE 4000

WORKDIR /darpan-backend

RUN mkdir -p /Pictures/Import

RUN mkdir -p /darpan-backend/db/sqlite

# RUN npm install -g @sap/cds-dk

COPY ./darpan-backend/package.json ./

# RUN apk add perl

# RUN apk add --no-cache --virtual .gyp \
#         python2 \
#         make \
#         g++ \
#     && npm install \
#     && apk del .gyp

COPY ./darpan-backend .

# RUN cds deploy --to sqlite:/darpan-backend/db/sqlite/index.db

VOLUME /darpan-backend/db/sqlite

EXPOSE 4004

CMD [ "cds", "run" ]