import { spawnSync } from 'node:child_process';

// A release must not silently succeed when the database integration suites skip.
const result = spawnSync(process.execPath, [
  '--import', 'tsx', '--test', '--test-global-setup=tests/support/globalPostgres.ts',
  '--test-concurrency=4', 'tests/**/*.test.ts',
], { stdio: 'inherit', env: { ...process.env, REQUIRE_INTEGRATION_TESTS: '1' } });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
