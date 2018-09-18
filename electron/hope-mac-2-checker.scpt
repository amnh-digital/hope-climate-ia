global lastMod
set lastMod to current date

on idle
	listenForHeartbeat()
	return 120 -- run every 2 minutes
end idle

on listenForHeartbeat()
	tell application "System Events"
		set myProcess to "hope-mac-2"
		set heartbeatFile to ((path to application support folder from user domain) as text) & myProcess & ":heartbeat.txt"
		set modDate to modification date of file heartbeatFile
		set timeDiff to modDate - lastMod
		if timeDiff < 0 then
			log "First run: last modified is after current modified"
		else if timeDiff ≤ 0 then
			log "App is unresponsive, attempting to kill and restart..."
			set processIds to (do shell script "ps ax | grep " & (quoted form of myProcess) & " | grep -v grep | awk '{print $1}'")
			if processIds is not "" then
				set processId to paragraph 1 of processIds
				log "Found pid " & processId
				do shell script ("kill -9 " & processId)
			else
				log "Could not find processId"
			end if
			restart
		end if
		set lastMod to modDate
	end tell
end listenForHeartbeat
