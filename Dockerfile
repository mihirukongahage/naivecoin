FROM node

COPY . /naivecoin

# VOLUME /naivecoin

WORKDIR /naivecoin

RUN ["npm", "install", "-y"]

# ENTRYPOINT node bin/naivecoin.js
CMD ["node", "bin/naivecoin.js"]

# EXPOSE 3001


