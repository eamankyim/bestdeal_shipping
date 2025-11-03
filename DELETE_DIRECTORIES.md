# Commands to Delete Directories on Server

## Safe Deletion Commands

### Option 1: Check First, Then Delete (Recommended)

```bash
# 1. First, check what's inside each directory to be sure
echo "=== bestdeal-db-server contents ==="
ls -la bestdeal-db-server/

echo ""
echo "=== rootsabitofrontend contents ==="
ls -la rootsabitofrontend/

# 2. If you're sure, delete them
rm -rf bestdeal-db-server/
rm -rf rootsabitofrontend/

# 3. Verify they're gone
ls -la
```

### Option 2: Backup First, Then Delete

```bash
# 1. Create a backup (just in case)
mkdir -p ~/backups/$(date +%Y%m%d)
cp -r bestdeal-db-server ~/backups/$(date +%Y%m%d)/ 2>/dev/null
cp -r rootsabitofrontend ~/backups/$(date +%Y%m%d)/ 2>/dev/null

# 2. Verify backup
ls -la ~/backups/$(date +%Y%m%d)/

# 3. Delete the directories
rm -rf bestdeal-db-server/
rm -rf rootsabitofrontend/

# 4. Verify deletion
ls -la
```

### Option 3: Quick Delete (If You're Confident)

```bash
# Delete both at once
rm -rf bestdeal-db-server/ rootsabitofrontend/

# Verify
ls -la
```

---

## Full Commands to Run on Server

Copy and paste this entire block:

```bash
# Navigate to home directory (if not already there)
cd ~

# Check current directories
echo "Current directories:"
ls -la

# Show sizes before deletion
echo ""
echo "Sizes before deletion:"
du -sh bestdeal-db-server/ rootsabitofrontend/ 2>/dev/null

# Double-check contents
echo ""
echo "=== bestdeal-db-server contents ==="
ls -la bestdeal-db-server/ 2>/dev/null

echo ""
echo "=== rootsabitofrontend contents ==="
ls -la rootsabitofrontend/ 2>/dev/null

# Delete directories
echo ""
echo "Deleting directories..."
rm -rf bestdeal-db-server/
rm -rf rootsabitofrontend/

# Verify deletion
echo ""
echo "Directories after deletion:"
ls -la

echo ""
echo "✅ Deletion complete!"
```

---

## After Deletion

You should only have:
- `bestdeal_shipping` (main Best Deal project)
- `sabito` (Sabito project)
- `fix-direct-url.sh` (script file)

Plus any other files you created.

