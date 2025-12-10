const oracledb = require('oracledb');

// Oracle Database Configuration
const dbConfig = {
  user: 'SYSTEM',
password: 'oracle123',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/XEPDB1'
};

// Initialize Oracle Client (if using Instant Client)
try {
  // For Windows - Update path to your Oracle Instant Client
  oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_21_9' });
  
  // For Linux - Uncomment below and comment above
  // oracledb.initOracleClient({ libDir: '/usr/lib/oracle/21/client64/lib' });
} catch (err) {
  console.error('Oracle Client initialization error:', err);
}

// Connection Pool
async function initialize() {
  try {
    await oracledb.createPool({
      user: dbConfig.user,
      password: dbConfig.password,
      connectString: dbConfig.connectString,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 2
    });
    console.log('âœ… Database connection pool created successfully');
  } catch (err) {
    console.error('âŒ Database pool creation error:', err);
    process.exit(1);
  }
}

async function close() {
  try {
    await oracledb.getPool().close(10);
    console.log('Database pool closed');
  } catch (err) {
    console.error('Error closing database pool:', err);
  }
}

module.exports = {
  initialize,
  close
};