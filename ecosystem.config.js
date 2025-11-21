module.exports = {
  apps: [
    {
      name: 'malmoi-booking-system',
      script: 'npm',
      args: 'start:nas',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      env_file: './env.nas',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // NAS 서버에서 안정적인 실행을 위한 설정
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
}; 