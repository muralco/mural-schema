FROM node:12.13.0-alpine3.9

ARG NPM_TOKEN

WORKDIR /src

COPY package*.json ./

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > /.npmrc
RUN npm audit
RUN npm ci
RUN rm -f /.npmrc

COPY . /src/
