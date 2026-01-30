const { execSync } = require('node:child_process');

function run(command) {
  console.log(`[prestart] ${command}`);
  execSync(command, { stdio: 'inherit' });
}

try {
  run('npx prisma migrate deploy');

  if (process.env.RUN_SEED_ON_START === 'true') {
    run('node prisma/seed.js');
  } else {
    console.log('[prestart] Skipping seed step (set RUN_SEED_ON_START=true to enable).');
  }
} catch (error) {
  console.error('[prestart] Failed to prepare database');
  console.error(error);
  process.exit(1);
}
