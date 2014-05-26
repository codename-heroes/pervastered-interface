from Logger.models import *
from django.contrib import admin

admin.site.register(Namespace)
admin.site.register(Event)
admin.site.register(EventType)
admin.site.register(Trigger)
admin.site.register(TriggerError)
admin.site.register(LogObject)
admin.site.register(Updater)
admin.site.register(InfoGrabber)
admin.site.register(GrabberError)


