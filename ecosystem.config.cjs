/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: 'quinlist',
      cwd: __dirname,
      script: 'npm',
      args: 'run start',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      // ESM (server/index.mjs): siempre fork. Cluster rompe con --env-file / import.
      name: 'quinlist-billing',
      cwd: __dirname,
      script: 'server/index.mjs',
      interpreter: 'node',
      node_args: '--env-file=.env',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        BILLING_PORT: '4012',
      },
    },
  ],
}
