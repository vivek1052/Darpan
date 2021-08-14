#!/usr/bin/bash

service nginx start &

cd /darpan-authentication-server

node server.js &

cd /darpan-backend

cds run