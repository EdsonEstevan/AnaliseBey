const { execSync } = require('node:child_process');

const FAILED_MIGRATION = '20260204_team_missions_and_xp';

function run(command) {
  console.log(`[prestart] ${command}`);
  const result = execSync(command, { stdio: ['inherit', 'pipe', 'pipe'] });

  if (result?.length) {
    process.stdout.write(result.toString());
  }
}

function logBuffers(error) {
  if (error?.stdout?.length) {
    process.stdout.write(error.stdout.toString());
  }

  if (error?.stderr?.length) {
    process.stderr.write(error.stderr.toString());
  }
}

function resolveFailedMigration(error) {
  const combinedOutput = `${error?.stdout?.toString() ?? ''}${error?.stderr?.toString() ?? ''}`;

  if (combinedOutput.includes('P3009') && combinedOutput.includes(FAILED_MIGRATION)) {
    console.warn(`[prestart] Detected ${FAILED_MIGRATION} failure (P3009). Attempting automatic resolve.`);
    run(`npx prisma migrate resolve --rolled-back ${FAILED_MIGRATION}`);
    run('npx prisma migrate deploy');
    return;
  }

  throw error;
}

function runMigrations() {
  try {
    run('npx prisma migrate deploy');
  } catch (error) {
    logBuffers(error);
    resolveFailedMigration(error);
  }
}

try {
  runMigrations();

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
