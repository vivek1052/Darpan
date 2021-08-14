#!/usr/bin/bash

nginx

cd /darpan-authentication-server

node server.js &

cd /darpan-backend

cds run