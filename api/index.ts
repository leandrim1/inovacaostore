// Ponto de entrada da função serverless da Vercel: reaproveita o mesmo app
// Express usado em desenvolvimento (server/src/index.ts), só que sem chamar
// `.listen()` — a Vercel invoca esse handler diretamente a cada requisição.
export { app as default } from "../server/src/app.js";
