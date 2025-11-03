# How to Check for Unused Ports on the Server

## Quick Commands

### 1. Check All Active Ports
```bash
# Show all listening ports with their processes
sudo netstat -tuln | grep LISTEN

# Or using ss (more modern, faster)
sudo ss -tuln | grep LISTEN

# Show with process names
sudo netstat -tulpn | grep LISTEN
# or
sudo ss -tulpn | grep LISTEN
```

### 2. Check Specific Port (e.g., port 3000)
```bash
# Check if port 3000 is in use
sudo lsof -i :3000

# Or using netstat
sudo netstat -tuln | grep :3000

# Or using ss
sudo ss -tuln | grep :3000
```

### 3. Check Range of Ports (e.g., 3000-3010)
```bash
# Check each port in range
for port in {3000..3010}; do
  if ! sudo lsof -i :$port > /dev/null 2>&1; then
    echo "✅ Port $port is AVAILABLE"
  else
    echo "❌ Port $port is IN USE"
  fi
done
```

### 4. Find First Available Port in Range
```bash
# Find first available port between 3000-3010
for port in {3000..3010}; do
  if ! sudo lsof -i :$port > /dev/null 2>&1 && ! sudo ss -tuln | grep -q ":$port "; then
    echo "✅ Port $port is AVAILABLE - Use this port!"
    break
  fi
done
```

### 5. Check Ports Used by Node/PM2 Processes
```bash
# If using PM2
pm2 list
pm2 info <app-name>

# Check all node processes and their ports
ps aux | grep node | grep -v grep

# Check ports used by specific user
sudo lsof -i -P -n | grep node
```

### 6. Simple One-Liner to Find Available Port
```bash
# Find first available port starting from 3000
port=3000
while sudo lsof -i :$port > /dev/null 2>&1 || sudo ss -tuln | grep -q ":$port "; do
  ((port++))
done
echo "✅ Available port: $port"
```

---

## Recommended: Create a Port Checker Script

Create this script on the server:

```bash
cat > check-port.sh << 'EOF'
#!/bin/bash

# Check if port is available
check_port() {
  local port=$1
  if sudo lsof -i :$port > /dev/null 2>&1 || sudo ss -tuln | grep -q ":$port "; then
    return 1  # Port is in use
  else
    return 0  # Port is available
  fi
}

# Find available port in range
find_available_port() {
  local start=$1
  local end=$2
  
  echo "🔍 Checking ports $start-$end..."
  
  for ((port=start; port<=end; port++)); do
    if check_port $port; then
      echo "✅ Port $port is AVAILABLE!"
      return 0
    else
      echo "❌ Port $port is in use"
    fi
  done
  
  echo "❌ No available ports in range $start-$end"
  return 1
}

# Main
if [ $# -eq 0 ]; then
  # Default: check 3000-3010
  find_available_port 3000 3010
elif [ $# -eq 1 ]; then
  # Check specific port
  port=$1
  if check_port $port; then
    echo "✅ Port $port is AVAILABLE!"
  else
    echo "❌ Port $port is IN USE"
    echo "📋 Process using port $port:"
    sudo lsof -i :$port 2>/dev/null || sudo ss -tulpn | grep ":$port "
  fi
elif [ $# -eq 2 ]; then
  # Check range
  find_available_port $1 $2
else
  echo "Usage:"
  echo "  ./check-port.sh           # Check ports 3000-3010"
  echo "  ./check-port.sh <port>    # Check specific port"
  echo "  ./check-port.sh <start> <end>  # Check port range"
fi
EOF

chmod +x check-port.sh
```

Then run:
```bash
# Check default range (3000-3010)
./check-port.sh

# Check specific port
./check-port.sh 3006

# Check custom range
./check-port.sh 3000 3020
```

---

## Step-by-Step: Find Available Port for Frontend

### Step 1: Check What's Currently Running
```bash
# See all listening ports
sudo ss -tuln | grep LISTEN | sort

# Or with process names
sudo netstat -tulpn | grep LISTEN | sort
```

### Step 2: Check Common Frontend Ports
```bash
# Check ports commonly used for frontend
for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010; do
  if sudo lsof -i :$port > /dev/null 2>&1; then
    echo "❌ Port $port: IN USE"
    sudo lsof -i :$port
  else
    echo "✅ Port $port: AVAILABLE"
  fi
done
```

### Step 3: Find First Available Port
```bash
# Find first available port starting from 3000
for port in {3000..3020}; do
  if ! sudo lsof -i :$port > /dev/null 2>&1 && ! sudo ss -tuln | grep -q ":$port "; then
    echo "✅ Found available port: $port"
    echo ""
    echo "💡 Add this to your frontend/.env file:"
    echo "   PORT=$port"
    break
  fi
done
```

---

## Alternative: Using Node.js Script (if Node is installed)

If you have Node.js on the server, you can use the check-port.js script:

```bash
cd /path/to/frontend
node check-port.js 3000 3010
```

Or install and use `netstat-linux` or `port-check` packages:
```bash
npm install -g port-check
port-check 3000
```

---

## Quick Reference Commands

| Task | Command |
|------|---------|
| **List all listening ports** | `sudo ss -tuln \| grep LISTEN` |
| **Check specific port** | `sudo lsof -i :3000` |
| **Find available port** | `for p in {3000..3010}; do ! sudo lsof -i :$p && echo $p && break; done` |
| **Check Node.js ports** | `sudo lsof -i -P -n \| grep node` |
| **Check PM2 processes** | `pm2 list` |

---

## After Finding Available Port

Once you find an available port (e.g., 3006):

1. **Update frontend/.env file:**
   ```bash
   echo "PORT=3006" >> frontend/.env
   ```

2. **Or manually edit the file:**
   ```bash
   nano frontend/.env
   # Add: PORT=3006
   ```

3. **Restart your frontend service:**
   ```bash
   pm2 restart frontend
   # or
   systemctl restart your-frontend-service
   ```

---

## Example Output

```
🔍 Checking ports 3000-3010...
❌ Port 3000 is in use
❌ Port 3001 is in use
❌ Port 3002 is in use
❌ Port 3003 is in use
❌ Port 3004 is in use
❌ Port 3005 is in use
✅ Port 3006 is AVAILABLE!

💡 Update your frontend/.env file with:
   PORT=3006
```

