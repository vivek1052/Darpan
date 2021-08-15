#!/usr/bin/bash

nginx

cd /darpan-backend

node authenticationServer.js &

cds run