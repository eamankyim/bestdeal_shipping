const app = require('./src/app');
const prisma = require('./src/config/database');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log('\n🚀 =========================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`📖 Also available at:`);
  console.log(`   - http://localhost:${PORT}/api-docs`);
  console.log(`   - http://localhost:${PORT}/docs`);
  console.log('=========================================\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
    
    console.log('👋 Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
    
    console.log('👋 Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
});