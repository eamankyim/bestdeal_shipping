# Check Directory Contents on Server

Run these commands on your server to understand what each directory contains:

## Quick Check Commands

### 1. Check what's inside each directory
```bash
# Check bestdeal-db-server
ls -la bestdeal-db-server/

# Check rootsabitofrontend
ls -la rootsabitofrontend/

# Check bestdeal_shipping (we know this is main project)
ls -la bestdeal_shipping/

# Check sabito (we know this is main project)
ls -la sabito/
```

### 2. Check directory sizes
```bash
# See which directories are actually being used
du -sh bestdeal-db-server/
du -sh rootsabitofrontend/
du -sh bestdeal_shipping/
du -sh sabito/
```

### 3. Check last modified dates
```bash
# See which directories were recently used
stat bestdeal-db-server/ | grep Modify
stat rootsabitofrontend/ | grep Modify
stat bestdeal_shipping/ | grep Modify
stat sabito/ | grep Modify
```

### 4. Quick overview
```bash
# See all at once
for dir in bestdeal-db-server rootsabitofrontend bestdeal_shipping sabito; do
  echo "=== $dir ==="
  echo "Size: $(du -sh $dir 2>/dev/null | cut -f1)"
  echo "Last modified: $(stat -c %y $dir 2>/dev/null | cut -d' ' -f1)"
  echo "Contents: $(ls $dir 2>/dev/null | head -5 | tr '\n' ', ')"
  echo ""
done
```

## Expected Scenarios:

### Scenario 1: Separate Setup Directories
- `bestdeal-db-server` = Separate database server configuration
- `rootsabitofrontend` = Separate frontend deployment for sabito

### Scenario 2: Duplicates/Old Directories
- `bestdeal-db-server` = Old/duplicate of database setup
- `rootsabitofrontend` = Old/duplicate of sabito frontend

### Scenario 3: Related Projects
- `bestdeal-db-server` = Database-only setup
- `rootsabitofrontend` = Frontend-only for sabito
- `bestdeal_shipping` = Full Best Deal project
- `sabito` = Full Sabito project

## After Investigation:

Once you run these commands, you can:
1. **Keep them** if they're separate deployments/configs
2. **Remove duplicates** if they're old/unused
3. **Rename them** for better organization

