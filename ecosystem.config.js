module.exports = {
    apps: [
        {
            name: 'zawadi-backend',
            script: './dist/index.js',
            cwd: './server',
            instances: 'max',
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env_production: {
                NODE_ENV: 'production',
                PORT: 5000
            }
        },
        {
            name: 'zawadi-cron',
            script: './dist/cron-worker.js',
            cwd: './server',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            env_production: {
                NODE_ENV: 'production'
            }
        }
    ]
};
