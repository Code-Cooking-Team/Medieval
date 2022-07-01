#!/usr/bin/env sh
# abort on errors
set -e

rm -rf ./dist

yarn ts
yarn test --run

yarn build

# navigate into the build output directory
cd ./dist

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git checkout -b main
git add -A
git commit -m 'deploy'

# Deploying to https://Code-Cooking-Team.github.io/Medieval
git push --force git@github.com:Code-Cooking-Team/Medieval.git main:gh-pages

cd -
