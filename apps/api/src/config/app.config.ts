export default () => ({
  port: parseInt(process.env.API_PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
});
