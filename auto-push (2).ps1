# Auto Push to GitHub Script
# This script watches for file changes and automatically commits & pushes to GitHub

Write-Host "[*] Auto-Push to GitHub Started" -ForegroundColor Green
Write-Host "[+] Watching: $PWD" -ForegroundColor Cyan
Write-Host "[!] Will auto-push every 5 minutes or on file save" -ForegroundColor Yellow
Write-Host "[!] Press Ctrl+C to stop" -ForegroundColor Red
Write-Host ""

$lastPushTime = Get-Date

function Push-ToGitHub {
    param (
        [string]$message = "Auto-save: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    )
    
    Write-Host "[~] Checking for changes..." -ForegroundColor Yellow
    
    # Check if there are changes
    $status = git status --porcelain
    
    if ($status) {
        Write-Host "[+] Changes detected. Committing and pushing..." -ForegroundColor Green
        
        # Add all changes
        git add .
        
        # Commit with timestamp
        git commit -m $message
        
        # Push to GitHub
        Write-Host "[^] Pushing to GitHub..." -ForegroundColor Cyan
        git push origin master
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Successfully pushed to GitHub!" -ForegroundColor Green
            Write-Host "-----------------------------------" -ForegroundColor Gray
        } else {
            Write-Host "[ERROR] Failed to push. Check your connection." -ForegroundColor Red
        }
        
        $script:lastPushTime = Get-Date
    } else {
        Write-Host "[i] No changes to commit" -ForegroundColor Gray
    }
}

# File System Watcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $PWD
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

# Ignore node_modules and other directories
$watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName -bor 
                        [System.IO.NotifyFilters]::DirectoryName -bor
                        [System.IO.NotifyFilters]::LastWrite

# Debounce timer to avoid too many commits
$timer = $null
$debounceSeconds = 30

$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    
    # Ignore node_modules, .git, and other directories
    if ($path -match "node_modules|\.git|\.next|dist|build") {
        return
    }
    
    # Ignore non-source files
    if (-not ($path -match "\.(js|jsx|ts|tsx|css|json|md|prisma|env)$")) {
        return
    }
    
    Write-Host "[*] File $changeType : $path" -ForegroundColor Cyan
    
    # Cancel existing timer
    if ($null -ne $script:timer) {
        $script:timer.Stop()
        $script:timer.Dispose()
    }
    
    # Create new timer (debounce)
    $script:timer = New-Object System.Timers.Timer
    $script:timer.Interval = $debounceSeconds * 1000
    $script:timer.AutoReset = $false
    
    Register-ObjectEvent -InputObject $script:timer -EventName Elapsed -Action {
        Push-ToGitHub -message "Auto-save: File changes detected"
    } | Out-Null
    
    $script:timer.Start()
}

# Register events
$handlers = @()
$handlers += Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action
$handlers += Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action
$handlers += Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action
$handlers += Register-ObjectEvent -InputObject $watcher -EventName "Renamed" -Action $action

Write-Host "[OK] File watcher active!" -ForegroundColor Green
Write-Host ""

# Main loop - also push every 5 minutes if there are changes
try {
    while ($true) {
        Start-Sleep -Seconds 300 # 5 minutes
        
        $timeSinceLastPush = (Get-Date) - $lastPushTime
        
        if ($timeSinceLastPush.TotalMinutes -ge 5) {
            Write-Host "`n[!] 5 minutes elapsed. Checking for changes..." -ForegroundColor Magenta
            Push-ToGitHub -message "Auto-save: Periodic backup ($(Get-Date -Format 'HH:mm'))"
        }
    }
} finally {
    # Cleanup
    Write-Host "`n[STOP] Stopping auto-push..." -ForegroundColor Red
    $handlers | ForEach-Object { Unregister-Event -SourceIdentifier $_.Name }
    $watcher.Dispose()
    if ($null -ne $timer) {
        $timer.Dispose()
    }
}

