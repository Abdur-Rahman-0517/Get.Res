@echo off
setlocal enabledelayedexpansion

:: Ask for folder path
echo.
set /p folder=Enter the full path to your Firebase project folder: 

:: Normalize folder path (remove quotes if any)
set "folder=!folder:"=!"

:: Check if firebase.json exists
if not exist "!folder!\firebase.json" (
    echo.
    echo  firebase.json not found in "!folder!".
    pause
    exit /b
)

:: Ask for site name
echo.
set /p sitename=Enter your Firebase Hosting site name (without .web.app): 

:: Normalize sitename
set "sitename=!sitename:"=!"

:: Confirm
echo.
echo  Deploying from "!folder!" to https://!sitename!.web.app ...

:: Change to target folder
pushd "!folder!"

:: Run Firebase deploy
call firebase deploy --only hosting:!sitename!

:: Return to original directory
popd

echo.
echo  Deployment finished!
pause
