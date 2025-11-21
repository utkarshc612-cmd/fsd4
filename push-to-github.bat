@echo off
cd /d "C:\Users\utkar\Documents\GitHub\fullstack_app"

echo Setting git configuration...
git config user.name "uc085211-boop"
git config user.email "utkarsh@example.com"

echo Staging all files...
git add .

echo Committing changes...
git commit -m "Full-stack teacher management system with 21/22 features implemented and CORS fixed for port 5501"

echo Adding remote repository...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/utkarshc612-cmd/fsd4.git

echo Pushing to GitHub...
git push -u origin main --force

echo Done!
pause
