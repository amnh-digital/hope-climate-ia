#!/bin/bash

echo "Disable screensaver"
defaults -currentHost write com.apple.screensaver idleTime -int 0

echo "Auto hide dock"
defaults write com.apple.dock autohide -bool true && \
killall Dock

## Operation not permitted while System Integrity Protection is engaged
# echo "Disable notification center service"
# launchctl unload -w /System/Library/LaunchAgents/com.apple.notificationcenterui.plist && \
# killall -9 NotificationCenter

echo "Disable the “Are you sure you want to open this application?” dialog"
defaults write com.apple.LaunchServices LSQuarantine -bool false

echo "Disable resume system-wide"
defaults write NSGlobalDomain NSQuitAlwaysKeepsWindows -bool FALSE

echo "Disable resume per application"
defaults write -g ApplePersistenceIgnoreState YES

echo "Disable crash reporter"
defaults write com.apple.CrashReporter DialogType none

echo "Disable the “reopen windows when logging back in” option"
defaults write com.apple.loginwindow TALLogoutSavesState -bool false
defaults write com.apple.loginwindow LoginwindowLaunchesRelaunchApps -bool false

echo "Disable smart quotes and dashes. Useful for safe editing of text files."
defaults write NSGlobalDomain NSAutomaticDashSubstitutionEnabled -bool false
defaults write NSGlobalDomain NSAutomaticQuoteSubstitutionEnabled -bool false

# Begin sudo for rest of script
sudo -v
while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null &

echo "Disable system sleep"
sudo pmset sleep 0

echo "Disable display sleep"
sudo pmset displaysleep 0

echo "Restart on power failure, freeze"
sudo systemsetup -setrestartpowerfailure on
sudo systemsetup -setrestartfreeze on

echo "Schedule shutdown and poweron"
sudo pmset repeat shutdown MTWRFSU 03:00:00 wakeorpoweron MTWRFSU 04:00:00

echo "Disable bluetooth"
sudo defaults write /Library/Preferences/com.apple.Bluetooth ControllerPowerState 0
sudo killall -HUP blued

echo "Disable : SystemPreferences -> AppStore -> Automatically check for updates"
sudo defaults write /Library/Preferences/com.apple.SoftwareUpdate AutomaticCheckEnabled -bool FALSE

echo "Disable Warning on opening new App."
suco spctl --master-disable

## Operation not permitted while System Integrity Protection is engaged
# echo "Disable the 'This Application Unexpectedly Quit' and the subsequent bug report"
# sudo chmod 000 /System/Library/CoreServices/Problem\ Reporter.app

## Operation not permitted while System Integrity Protection is engaged
# echo "Disable crash reports"
# sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.CrashReporterSupportHelper.plist && killall -9 CrashReporterSupportHelper
# launchctl unload -w /System/Library/LaunchAgents/com.apple.ReportCrash.plist
# sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.ReportCrash.Root.plist
