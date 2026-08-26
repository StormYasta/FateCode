import { buildServer } from './server.js';
import { env } from './config/env.js';

async function main() {
  const app = await buildServer();

  try {
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });
    console.log(`\n🚀 FateCode API Server running at: ${address}`);
    console.log(`📚 Swagger documentation at: ${address}/docs`);
    console.log(`🩺 Healthcheck at: ${address}/api/health\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
