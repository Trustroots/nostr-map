FROM node:20

WORKDIR /app

COPY src package.json yarn.lock ./

# bugfix, stop npm from using ssh even when https is specified
RUN git config --global url."https://".insteadOf ssh://

RUN yarn install

CMD ["npm", "run", "start"]

EXPOSE 1234
