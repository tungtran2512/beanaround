FROM node:24-bookworm-slim
WORKDIR /app
COPY index.html ./index.html
COPY assets ./assets
COPY coop ./coop
COPY server ./server
RUN mkdir -p /data && chown node:node /data
USER node
ENV PORT=3000 COOP_DB=/data/coop.sqlite
EXPOSE 3000
CMD ["node","server/server.cjs"]
