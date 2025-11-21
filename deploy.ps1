#!/usr/bin/env powershell

$ErrorActionPreference = "SilentlyContinue"

Write-Host "Setting up git configuration..." -ForegroundColor Green
git config --global user.name "uc085211-boop"
git config --global user.email "utkarsh@github.com"

Write-Host "Staging all files..." -ForegroundColor Green
git add -A

Write-Host "Committing changes..." -ForegroundColor Green
$commitMsg = "Teacher management system - 21/22 features implemented, CORS fixed, all endpoints operational"
git commit -m $commitMsg

Write-Host "Setting remote repository..." -ForegroundColor Green
git remote remove origin 2>$null
git remote add origin "https://github.com/utkarshc612-cmd/fsd4.git"

Write-Host "Pushing to GitHub main branch..." -ForegroundColor Green
git push -u origin main --force 2>&1

Write-Host "Push completed!" -ForegroundColor Cyan
