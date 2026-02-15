module.exports = {
  apps: [
    {
      name: 'writer',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/writer',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/writer/pm2-error.log',
      out_file: '/var/log/writer/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      max_memory_restart: '1G',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
