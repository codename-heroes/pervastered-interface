from django.utils import simplejson
from Logger.models import *
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.serializers import serialize
from django.utils.simplejson import dumps, loads, JSONEncoder
from django.db.models.query import QuerySet
from django.utils.functional import curry
from datetime import *
from time import mktime
import urllib2
import execjs
import sys

from Logger.main import csrf_exempt
from Logger.realtime_api import RealtimeAPI
from Logger.utils import *


def ToJSON(elements):
    response = []
    if elements:
        for e in elements :
            response.append(e.json())

    return response

def GetNamespaceById(id):
    if id:
        try :
            id = int(id)
            return Namespace.objects.get(id=id)
        except err:
            pass

    return None

def GetNamespaceByName(name):
    if name :
        try:
            return Namespace.objects.get(name=name)
        except:
            pass

    return None

def GetNamespace(namespace):
    result = None
    if isinstance(namespace, dict):
        id = namespace.get("id")
        result = GetNamespaceById(id)

        if result == None:
            name = namespace.get("name")
            result = GetNamespaceByName(name)

    elif isinstance(namespace, unicode):
        result = GetNamespaceByName(namespace)
        if result == None:
            result = GetNamespaceById(namespace)

    return result



'''
======== API METHODS ==========
'''
@csrf_exempt
def ApiEvents(request):
    events = Event.objects.all()

    filters = None
    if request.raw_post_data:
        body = str(request.raw_post_data)
        json =  simplejson.loads(body)
        filters = json.get("filter")

    if  filters and isinstance(filters, dict):
        filter_date_range = filters.get("date_range")
        if filter_date_range:
            print filter_date_range
            events = events.filter(date__range=filter_date_range)
            print len(events)


        filter_month = filters.get("month")
        if filter_month:
            events = events.filter(date__month=filter_month)

        filter_day = filters.get("day")
        if filter_day:
            events = events.filter(date__day=filter_day)

        filter_year = filters.get("year")
        if filter_year:
            events = events.filter(date__year=filter_year)


        filter_namespace = filters.get("namespace")
        if filter_namespace:
            events = events.filter(namespace__name=str(filter_namespace))

            filter_object = filters.get("object")
            if filter_object:
                events = events.filter(involved_objects__external_identifier=filter_object)

            filter_type = filters.get("type")
            if filter_type:
                events = events.filter(type__name=filter_type)

        filter_date = filters.get("date")
        if filter_date == "last":
            ids = events.values_list("involved_objects__id", flat=True).distinct()
            events = events.order_by("-date")
            result = []
            for id in ids:
                result.append(events.filter(involved_objects__id=id)[0])
            events = result

    # we just have to order_by in case last is not specified as filter_date (since we already have ordered)
    if type(events) != list:
        events = events.order_by("date")

    events = ToJSON(events)

    return jsonResponse({"events" : events})


@csrf_exempt
def ApiEvent(request):
    response = Event.objects.select_related().values_list("id", "name", "info","namespace", "date", "type", "involved_objects").all()

    return jsonResponse({"event" : response})

# http://docs.python.org/2/howto/urllib2.html
@csrf_exempt
def ExecuteUpdater(updater):
    info = GetGrabberResult(updater)
    if not isinstance(info, dict):
        return info

    triggers = updater.triggers.all()
    js = execjs.get()
    events = []

    for trigger in triggers:
        try:
            ctx = js.compile(trigger.evaluator)
            res = ctx.call(trigger.name, info)
            events.extend(res)


            for e in res:
                event = None
                if "id" in e:
                    e_id = e["id"]
                    event = Event.objects.filter(id=e_id)
                    if len(event) == 1:
                        event = event[0]
                    else:
                        e_id = None
                        event = None

                if "tag" in e:
                    e_tag = e["tag"]

                    if event:
                        event.tag = e_tag
                else:
                    e_tag = ""

                if "info" in e:
                    if isinstance(e["info"], dict):
                        e_info = simplejson.dumps(e["info"])
                    else:
                        e_info = e["info"]

                    if event:
                        event.info = e_info
                else:
                    e_info = ""

                if "type" in e:
                    e_type = EventType.objects.get(name=e["type"], namespace=updater.namespace)
                    if event:
                        event.type = e_type
                elif event == None:
                    continue

                if event == None:
                    event = Event(info=e_info, namespace=updater.namespace, tag=e_tag, trigger=trigger, type=e_type)
                    event.save()
                else:
                    event.save()

                if "involved_objects" in e:
                    involved_objects = e["involved_objects"]
                    for i in involved_objects:
                        if "id" in i:
                            i_id = i["id"]

                            if "info" in i:
                                i_info = i["info"]
                            else:
                                i_info = ""

                            obj = LogObject.objects.filter(namespace=updater.namespace, external_identifier=i_id)
                            if len(obj) < 1:
                                obj = LogObject(external_identifier=i_id, info=i_info, namespace=updater.namespace)
                                obj.save()
                            else:
                                obj = obj[0]

                            event.involved_objects.add(obj)

                event.save()
                RealtimeAPI().broadcast(str(updater.namespace.name), str(event.type.name), event.json())
        except:
            error = TriggerError(trigger=trigger, context=simplejson.dumps(info, indent=4),evaluator=trigger.evaluator, error=str(sys.exc_info()[1]), updater=updater)
            error.save()

    return jsonResponse(events)

def GetGrabberResult(updater):
    info = {}
    grabbers = updater.involved_info.all().order_by('priority')

    grabb = None
    try:
        for grabber in grabbers:
            grabb = grabber
            if grabb.content:
                req = urllib2.Request(grabber.url, grabber.content, {'Content-Type': 'application/json', 'Content-Length': len(grabber.content)})
            else:
                req = urllib2.Request(grabber.url)
            result = urllib2.urlopen(req)
            info[grabber.name] = simplejson.loads(result.read())
    except:
        error = GrabberError(grabber=grabb, error= str(sys.exc_info()[1]), updater=updater)
        error.save()
        return HttpResponse("error")

    return info

@csrf_exempt
def UpdaterGrabbersResult(request, id):
    updater = Updater.objects.get(id=id)
    result = GetGrabberResult(updater)
    if isinstance(result, dict):
        return jsonResponse(result)
    return result

@csrf_exempt
def EventsValidate(request, id):
    updater = Updater.objects.get(id=int(id))

    if request.raw_post_data:
        events =  simplejson.loads(request.raw_post_data)

        error = ValidateEvents(updater, events)

        if error == "":
            return jsonResponse({"result": "ok"})
        else:
            return jsonResponse({"result": "error", "message": error })

    return jsonResponse({"result":"error" ,"message": "No events"})

@csrf_exempt
def ValidateEvents(updater, events):
    error = ""
    i = 0
    ''

    for e in events:
        for attr in e:
            if attr == "involved_objects":
                if not isinstance(e[attr], type([])):
                    error += "[event " + str(i) + "] '" + str(attr) + "' is " + str(type(e[attr])) + " but must be an array. \n"
                else:
                    for object in e[attr]:
                        if not isinstance(object, dict):
                            error += "[event " + str(i) + "] '" + str(attr) + "' contains element of type " + str(type(object))+ " but must be a {}. \n"
                        else :
                            for tag in object:
                                if not (tag == "id" or tag == "info"):
                                    error += "[event " + str(i) +"] invalid tag '"+ tag + "' in involved_object value"
            elif attr == "type":
                if not isinstance(e[attr], unicode):
                    error += "[event " + str(i) + "] '" + str(attr) + "' is " + str(type(e[attr]))+ " but must be a string. \n"
                else:
                    eventTypes = EventType.objects.filter(namespace=updater.namespace).values_list('name', flat=True)
                    if not ( e[attr] in eventTypes):
                        error += "[event " + str(i) + "] '" + str(e[attr]) + "' is not a correct event type. \n"
            elif attr == "info" or attr == "tag" or attr=="id":
                pass
            else:
                error += "[event " + str(i) + "] '" + str(attr) + "' is not a valid tag, please use just one of these: involved_objects (array), info(str), type(str), tag(str). \n"

        i += 1

    return error


@csrf_exempt
def TriggerErrors(request, id):
    error = TriggerError.objects.get(id=id)

    return jsonResponse(error.json())

