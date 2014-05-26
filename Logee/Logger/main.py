#! /opt/local/bin/python2.7
# -*- coding: utf-8 -*-

from django.template.loader import get_template
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied
from django.template import Context
from Logger.models import *
from django.utils import simplejson
import json
from datetime import datetime
import time
from django.views.decorators.csrf import csrf_exempt
from Logger.api import *
from django.utils import timezone
import time
from datetime import datetime
from Logger.utils import *

@csrf_exempt
def EditUpdater(request, id):
    updater = Updater.objects.select_related().get(id=id)
    updater.grabber_errors = GrabberError.objects.all().filter(updater=updater)
    updater.trigger_errors = TriggerError.objects.all().filter(updater=updater)

    return generate(request, "updater.html", {
        "updater": updater
    })


@csrf_exempt
def ShowUpdaters(request):
    updaters = Updater.objects.all()

    return generate(request, "updaters.html", {
        "updaters" : updaters
    })

@csrf_exempt
def Index(request):
    return generate(request, "index.html")



@Async
def ExecuteMainLoop():
    while True:
        try:
            read = urllib2.urlopen(urllib2.Request("http://localhost:8000/api/loop"))
        except Exception as e:
            print e

        time.sleep(5)

@csrf_exempt
def CheckUpdaters(request):
    try:
        updaters = Updater.objects.filter(enabled=True)
        for u in updaters:
            if u.rate:
                rate = int(u.rate)
                _date = u.date.replace(tzinfo=None)
                if rate and (datetime.now() - _date).total_seconds() > 20:#rate*60:
                    res = ExecuteUpdater(u)
                    u.date = datetime.now()
                    u.save()
    except Exception as e:
        print e
        pass

    return HttpResponse("ok")

@csrf_exempt
def Test(request):
    from Logee.realtime_api import RealtimeAPI

    RealtimeAPI().broadcast("namespace:Codename Heroes/Social", "buh")

    return HttpResponse("hello")






