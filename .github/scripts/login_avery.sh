#!/bin/bash
curl -s -X POST https://dummyjson.com/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"username": "$API_USERNAME","password": "$API_PASSWORD"}' \
    | jq -r .accessToken


curl GET 