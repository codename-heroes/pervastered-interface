
from Logger.main import ExecuteMainLoop
from Logger.realtime_api import RealtimeAPI


RealtimeAPI().initServer(8002, False).start()
print "executeMainLoop"
ExecuteMainLoop()