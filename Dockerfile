FROM node:20

WORKDIR /app

COPY package.json yarn.lock ./

# bugfix for npm using ssh even when https is specified
RUN git config --global url."https://".insteadOf ssh://

RUN yarn global add parcel-bundler

COPY . .

RUN yarn install

CMD ["yarn", "start"]

EXPOSE 1234
