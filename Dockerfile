FROM node:14-slim

WORKDIR /

RUN apt-get -y update 

RUN apt-get -y install nginx perl ffmpeg

#Nginx reverse proxy and static file server
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

#Ui Files
RUN mkdir /UI-Static-Files

COPY ./darpan-frontend/dist /UI-Static-Files

# Backend server
WORKDIR /darpan-backend

RUN mkdir -p /Pictures/Import

RUN mkdir -p /darpan-backend/db/sqlite

RUN npm install -g @sap/cds-dk

COPY ./darpan-backend .

RUN npm install

RUN cds deploy --to sqlite:/darpan-backend/db/sqlite/index.db

VOLUME /darpan-backend/db/sqlite

WORKDIR /

COPY ./start.sh ./

EXPOSE 80

CMD [ "sh", "./start.sh" ]