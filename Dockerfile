FROM denoland/deno:alpine

WORKDIR /app

COPY . .

RUN deno cache main.ts
RUN deno task build

RUN chown -R deno:deno /app

USER deno:deno

EXPOSE 8000

CMD ["run", "-A", "main.ts"]