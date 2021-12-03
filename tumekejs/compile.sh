#!/bin/zsh

./node_modules/.bin/babel src --out-dir lib
yq eval -o=json ../config/rula.yaml &> config/rula.json
yq eval -o=json ../config/reba.yaml &> config/reba.json
yq eval -o=json ../config/niosh.yaml &> config/niosh.json
