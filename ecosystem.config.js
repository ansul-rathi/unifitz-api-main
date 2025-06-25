module.exports = {
    apps: [
      {
        name: 'unifitz-api', // Name of your app
        script: './dist/server.js', // Path to the compiled JS file
        instances: 'max', // Use all available CPU cores
        exec_mode: 'cluster', // Run in cluster mode for better performance
        watch: false, // Set to true if you want PM2 to watch for changes
        autorestart: true,
        max_memory_restart: '500M', // Restart if memory exceeds 500MB
        env: {
          NODE_ENV: 'production',
        },
        env_development: {
          NODE_ENV: 'development',
          PORT: 3000,
        },
        env_local: {
          NODE_ENV: 'local',
          PORT: 3000,
        },
        output: './logs/output.log', // Output log file
        error: './logs/error.log', // Error log file
        log_date_format: 'YYYY-MM-DD HH:mm Z',
      },
    ],
  };
  