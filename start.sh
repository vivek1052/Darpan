#!/usr/bin/bash

cd ./darpan-authentication-server

node server.js &

cd ./darpan-backend

cds run