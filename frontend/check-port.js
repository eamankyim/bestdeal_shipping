/**
 * Port Availability Checker
 * Checks if a specific port is available, or finds the first available port from a range
 */

const net = require('net');

/**
 * Check if a port is available
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - true if port is available, false otherwise
 */
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, '127.0.0.1', () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Find first available port in a range
 * @param {number} startPort - Starting port number
 * @param {number} endPort - Ending port number
 * @returns {Promise<number|null>} - First available port or null if none found
 */
async function findAvailablePort(startPort, endPort) {
  for (let port = startPort; port <= endPort; port++) {
    const available = await checkPortAvailable(port);
    if (available) {
      return port;
    }
    console.log(`Port ${port} is in use...`);
  }
  return null;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Default: Check ports 3000-3010
    console.log('🔍 Checking for available ports in range 3000-3010...\n');
    const availablePort = await findAvailablePort(3000, 3010);
    
    if (availablePort) {
      console.log(`✅ Port ${availablePort} is available!`);
      console.log(`\n💡 Update your .env file with:`);
      console.log(`   PORT=${availablePort}`);
    } else {
      console.log('❌ No available ports found in range 3000-3010');
      console.log('💡 Try running: node check-port.js <startPort> <endPort>');
    }
  } else if (args.length === 1) {
    // Check specific port
    const port = parseInt(args[0], 10);
    if (isNaN(port)) {
      console.error('❌ Invalid port number:', args[0]);
      process.exit(1);
    }
    
    console.log(`🔍 Checking if port ${port} is available...`);
    const available = await checkPortAvailable(port);
    
    if (available) {
      console.log(`✅ Port ${port} is available!`);
    } else {
      console.log(`❌ Port ${port} is already in use`);
      process.exit(1);
    }
  } else if (args.length === 2) {
    // Check range
    const startPort = parseInt(args[0], 10);
    const endPort = parseInt(args[1], 10);
    
    if (isNaN(startPort) || isNaN(endPort)) {
      console.error('❌ Invalid port range:', args[0], args[1]);
      process.exit(1);
    }
    
    if (startPort > endPort) {
      console.error('❌ Start port must be less than or equal to end port');
      process.exit(1);
    }
    
    console.log(`🔍 Checking for available ports in range ${startPort}-${endPort}...\n`);
    const availablePort = await findAvailablePort(startPort, endPort);
    
    if (availablePort) {
      console.log(`✅ Port ${availablePort} is available!`);
      console.log(`\n💡 Update your .env file with:`);
      console.log(`   PORT=${availablePort}`);
    } else {
      console.log(`❌ No available ports found in range ${startPort}-${endPort}`);
    }
  } else {
    console.log('Usage:');
    console.log('  node check-port.js                    # Check ports 3000-3010');
    console.log('  node check-port.js <port>              # Check specific port');
    console.log('  node check-port.js <start> <end>       # Check port range');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { checkPortAvailable, findAvailablePort };

