import { buildApp } from "./app";
const app = buildApp();
await app.listen({ host: "127.0.0.1", port: Number(process.env.PORT ?? 3001) });
console.log(
  "Job Radar backend listening on localhost:" + (process.env.PORT ?? 3001),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    void app.close();
  });
