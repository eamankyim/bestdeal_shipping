# 🚀 Auto-Push to GitHub Guide

This guide explains how to automatically push your code changes to GitHub.

## 📋 Two Scripts Available

### **1. Simple Auto-Push** (`auto-push-simple.ps1`)
- ✅ Pushes every 5 minutes
- ✅ Easy to understand
- ✅ Lightweight

### **2. Advanced Auto-Push** (`auto-push.ps1`)
- ✅ Watches for file changes
- ✅ Debounces (waits 30 seconds after last change)
- ✅ Also pushes every 5 minutes as backup
- ✅ Ignores node_modules, .git, etc.

---

## 🎯 How to Use

### **Option A: Simple Script (Recommended for Beginners)**

1. **Open PowerShell in project directory:**
   ```powershell
   cd C:\Users\USER\Desktop\Learning\bestdeal_shipping
   ```

2. **Run the script:**
   ```powershell
   .\auto-push-simple.ps1
   ```

3. **What it does:**
   - Checks for changes every 5 minutes
   - If changes found → commits & pushes
   - Shows progress in console

4. **To stop:** Press `Ctrl+C`

---

### **Option B: Advanced Script (Recommended for Active Development)**

1. **Allow script execution (first time only):**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Run the script:**
   ```powershell
   .\auto-push.ps1
   ```

3. **What it does:**
   - Watches for file changes (js, jsx, css, json, md, etc.)
   - Waits 30 seconds after last change (debounce)
   - Auto-commits and pushes
   - Also pushes every 5 minutes as backup
   - Ignores node_modules, .git, dist, build folders

4. **To stop:** Press `Ctrl+C`

---

## 🎨 What You'll See

**Simple Script:**
```
🚀 Simple Auto-Push Started
⏱️  Will push to GitHub every 5 minutes
Press Ctrl+C to stop

📝 [2025-10-15 01:30:00] Changes detected. Pushing to GitHub...
✅ Successfully pushed to GitHub!
-----------------------------------
ℹ️  [01:35:00] No changes to push
```

**Advanced Script:**
```
🚀 Auto-Push to GitHub Started
📁 Watching: C:\Users\USER\Desktop\Learning\bestdeal_shipping
⏱️  Will auto-push every 5 minutes or on file save

📄 File Changed: src\pages\JobsPage.jsx
📝 Checking for changes...
✅ Changes detected. Committing and pushing...
⬆️  Pushing to GitHub...
✅ Successfully pushed to GitHub!
```

---

## ⚙️ Customization

### **Change Push Frequency:**

Edit the script and find:
```powershell
Start-Sleep -Seconds 300  # 300 seconds = 5 minutes
```

Change to:
- `60` = 1 minute
- `180` = 3 minutes
- `600` = 10 minutes

### **Change Debounce Time (Advanced Script):**

```powershell
$debounceSeconds = 30  # Wait 30 seconds after last file change
```

---

## 🔒 Security Notes

1. **GitHub Authentication:**
   - Make sure you're authenticated with GitHub
   - Use SSH keys or Personal Access Token
   - Test with: `git push origin master`

2. **Execution Policy:**
   - PowerShell might block scripts by default
   - Run once: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

3. **Network:**
   - Requires stable internet connection
   - Failed pushes will be logged but won't crash the script

---

## 🛑 How to Stop Auto-Push

**In the PowerShell window running the script:**
- Press `Ctrl+C`
- Confirm with `Y` if asked

**To stop all background instances:**
```powershell
Get-Process powershell | Where-Object { $_.CommandLine -like '*auto-push*' } | Stop-Process
```

---

## 📊 Alternative: VS Code Extension

If you prefer a GUI solution:

1. **Install Extension:**
   - Open Cursor/VS Code
   - Extensions → Search: "Git Auto Push"
   - Install **"Git Auto Commit and Push"** by **Damien Seguin**

2. **Configure in settings.json:**
   ```json
   {
     "git.enableAutoCommit": true,
     "git.enableAutoPush": true,
     "git.autoCommitDelay": 300000,
     "git.autoCommitMessage": "Auto-save: ${date}"
   }
   ```

---

## ✅ Recommendation

**For Active Development:**
```powershell
# Run this in a separate PowerShell window
.\auto-push.ps1
```

**Leave it running while you code!** Your changes will automatically backup to GitHub.

---

## 🎯 Quick Start

```powershell
# 1. Open PowerShell in project folder
cd C:\Users\USER\Desktop\Learning\bestdeal_shipping

# 2. Run simple script
.\auto-push-simple.ps1

# Done! Your code auto-pushes every 5 minutes
```

---

**Note:** The script runs in the foreground. Open a separate PowerShell window for development work.

