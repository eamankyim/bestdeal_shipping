#!/bin/bash
echo "Ì∫Ä Deploying to Production Branch..."

# Check if we're on master branch
if [ "$(git branch --show-current)" != "master" ]; then
    echo "‚ùå Error: Must be on master branch to deploy"
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "‚ùå Error: Uncommitted changes detected"
    exit 1
fi

# Switch to production branch
git checkout production

# Merge master into production
git merge master

# Remove unnecessary files
echo "Ì∑π Cleaning production files..."
rm -rf *.md
rm -rf docs/
rm -rf test/
rm -rf tests/
rm -rf __tests__/
rm -rf .vscode/
rm -rf .idea/
rm -rf *.log
rm -rf .env.example
rm -rf .env.development
rm -rf .env.local
rm -rf .env.test

# Add only production files
git add .

# Commit clean production
git commit -m "Production deployment: $(date)"

# Push to production
git push origin production

# Switch back to master
git checkout master

echo "‚úÖ Production deployment completed!"
