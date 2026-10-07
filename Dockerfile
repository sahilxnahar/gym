FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node . .
RUN chmod 755 /app/entrypoint.sh && mkdir -p /app/data && chown node:node /app/data
ENV NODE_ENV=production PORT=3000 DATA_DIR=/app/data
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
