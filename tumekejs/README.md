# tumekejs

## Installation instructions

- Run `brew install yq`
- Run `yarn install`

## Testing instructions

Run `yarn test`. All tests should pass. 

## Build instructions

The `package.json` runs a prepublish/pretest script called `compile.sh`
This script converts all the yaml files to json. The json files are explicitly
excluded from source tracking, and the yaml files are excluded from bring published.
