#!/bin/zsh

./node_modules/.bin/babel src --out-dir lib
yq eval -j ../config/rula.yaml &> config/rula.json
yq eval -j ../config/reba.yaml &> config/reba.json
yq eval -j ../config/niosh.yaml &> config/niosh.json
