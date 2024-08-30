##
# NOTE
# This docker file doesn't work, somehow node_modules is not created by `yarn install`
# We're not using this, so leaving it alone for now

FROM node:22

WORKDIR /app

COPY src /app/src/
COPY public /app/public/
COPY package.json yarn.lock ./

# bugfix, stop npm from using ssh even when https is specified
RUN git config --global url."https://".insteadOf ssh://

RUN corepack enable

RUN mkdir node_modules

RUN yarn install

# RUN yarn build

CMD ["yarn", "start"]

EXPOSE 1234
