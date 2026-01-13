# Simple Auto-Push Script
# Automatically commits and pushes to GitHub every 5 minutes

Write-Host "[*] Simple Auto-Push Started" -ForegroundColor Green
Write-Host "[!] Will push to GitHub every 5 minutes" -ForegroundColor Yellow
Write-Host "[!] Press Ctrl+C to stop" -ForegroundColor Red
Write-Host ""

while ($true) {
    # Check for changes
    $status = git status --porcelain
    
    if ($status) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[+] [$timestamp] Changes detected. Pushing to GitHub..." -ForegroundColor Cyan
        
        # Add all changes
        git add .
        
        # Commit
        git commit -m "Auto-save: $timestamp"
        
        # Push
        git push origin master
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Successfully pushed to GitHub!" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Failed to push. Check your connection or credentials." -ForegroundColor Red
        }
        
        Write-Host "-----------------------------------" -ForegroundColor Gray
    } else {
        Write-Host "[i] [$(Get-Date -Format 'HH:mm:ss')] No changes to push" -ForegroundColor Gray
    }
    
    # Wait 5 minutes
    Start-Sleep -Seconds 300
}

