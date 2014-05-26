#! /opt/local/bin/python2.7
# -*- coding: utf-8 -*-


from web import settings
from django.template.loader import get_template
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied
from django.template import Context
from web import mudAPI
import json
from datetime import datetime
import time

def superuser_only(function):
    """
    Limit view to superusers only.  This is from:     http://djangosnippets.org/snippets/1575/

    Usage:
    --------------------------------------------------------------------------
    @superuser_only
    def my_view(request):
        ...
    --------------------------------------------------------------------------
    or in urls:
    --------------------------------------------------------------------------
    urlpatterns = patterns('',
        (r'^foobar/(.*)', superuser_only(my_view)),
    )
    --------------------------------------------------------------------------
    """
    def _inner(request, *args, **kwargs):
        if not request.user.is_superuser:
            raise PermissionDenied
        return function(request, *args, **kwargs)
    return _inner

def generate(request,template_name,template_values={}):
#the base template generator function with some default data
    values = {
        'basepath':settings.BASEPATH,
        'user': request.user,
        'analytics_id':settings.ANALYTICS_ID,
        'jquery':settings.JQUERY,
        'jquery_server':settings.JQUERY_SERVER,
        'main_js':settings.MAIN_JS,
        'plugins_js':settings.PLUGINS_JS,
        'bootstrap':settings.BOOTSTRAP,
        'bootstrap_css':settings.BOOTSTRAP_CSS,
        'bootstrap_responsive_css':settings.BOOTSTRAP_RESPONSIVE_CSS,
        'main_css':settings.MAIN_CSS,
        'modernizr':settings.MODERNIZR,
        'footer_text':settings.FOOTER
    }
    values.update(template_values)
    t = get_template(template_name)
    return HttpResponse(t.render(Context(values)))

mud = mudAPI.MUD()

'''
Web Interface
'''

def Home(request):
    return generate(request, "index.html", )

def Map(request):
    return generate(request,"location.html",{'open_street_map':settings.OPEN_STREET_MAP,
                                        'leaflet': settings.LEAFLET})
def Players(request):
    global mud
    players = mud.GetUsers(request)

    return generate(request,"includes/elements_base.html",{
        "element": "player",
        "elements": json.loads(players),
        "element_base": "includes/player_list.html",
        "json_raw": players.replace("u'", "\"").replace("'", "\"")
    })

def Stats(request):
    return generate(request,"stats.html",{})

def Quests(request):
    global mud
    quests = mud.GetQuests(request)

    return generate(request,"includes/elements_base.html",{
        "element": "quest",
        "elements": json.loads(quests),
        "element_base": "includes/quest_list.html"
    })

def Messages(request):
    global mud
    messages = mud.GetMessages(request)

    return generate(request,"includes/elements_base.html",{
        "element": "message",
        "elements": json.loads(messages),
        "element_base": "includes/message_list.html",
        "json_raw": messages.replace("u'", "\"").replace("'", "\"")
    })

def Rituals(request):
    global mud
    rituals = mud.GetRituals(request)

    return generate(request,"includes/elements_base.html",{
        "element": "ritual",
        "elements": json.loads(rituals),
        "element_base": "includes/ritual_list.html",
        "json_raw": rituals.replace("u'", "\"").replace("'", "\"")
    })

def Locations(request):
    global mud
    rituals = mud.GetRituals(request)
    players = mud.GetUsers(request)
    messages = mud.GetMessages(request)
    rituals = rituals[:-1]
    messages = messages[1:-1]
    players = players[1:]
    json_raw = rituals + "," + messages + "," + players

    return generate(request,"locations.html",{
        'open_street_map':settings.OPEN_STREET_MAP,
        'leaflet': settings.LEAFLET,
        'json_raw': json_raw
    })

def Test(request):
    return generate(request, "test.html", {})


def GetUser(request, user):
    global mud
    user = mud.GetUser(request, user)

    return generate(request, "player_info.html", {
        "player": json.loads(user),
        "comments": "",
    })

def GetMessage(request, message):
    global mud
    message = mud.GetMessage(request, message)

    return generate(request, "message_info.html", {
        "message": json.loads(message),
        "comments": "",
    })

def GetRitual(request, ritual):
    global mud
    ritual = mud.GetRitual(request, ritual)

    return generate(request, "ritual_info.html", {
        "ritual": json.loads(ritual),
        "comments": "",
    })

def GetUnknown(request, id):
    global mud
    response = mud.GetUnknown(request, id)
    response = json.loads(response)
    if (response["type"] == "quest"):
        structure = [];
        response["json_visualization"] = str(QuestJSONtoVisualization(response, structure)).replace("u'", "\"").replace("'", "\"");
        response["quest_structure"] = structure;
        print structure

    return generate(request, response["type"]+ "_info.html", {
        response["type"] : response ,
        "comments": "",
    })

def QuestJSONtoVisualization(questJSON, structure):
    result = {}
    if questJSON.has_key("type"):
        result["name"] = questJSON["name"]
        result["params"] = {"id":questJSON["id"], "players": questJSON["players"]}
        structure.append({"name":result["name"], "player_list":questJSON["players_list"]})
        for exit in questJSON["exits"]:
            if not result.has_key("children"):
                result["children"] = []
            result["children"].append(QuestJSONtoVisualization(exit, structure))
    elif questJSON.has_key("destiny"):
        result = QuestJSONtoVisualization(questJSON["destiny"], structure)
        result["params"]["edge"] = questJSON["name"]
        result["params"]["edge_id"] = questJSON["id"]

    return result


def JsonQuest(request, id):
    global mud
    return HttpResponse(mud.GetQuest(request, id))

def JsonRitual(request, id):
    global mud
    return HttpResponse(mud.GetRitual(request, id))

def JsonUser(request, id):
    global mud
    return HttpResponse(mud.GetUser(request, id))

def JsonMessage(request, id):
    global mud
    return HttpResponse(mud.GetMessage(request, id))

def JsonUnknown(request, id):
    global mud
    return HttpResponse(mud.GetUnknown(request, id))

def JsonRituals(request):
    global mud
    return HttpResponse(mud.GetRituals(request))

def JsonQuests(request):
    global mud
    return HttpResponse(mud.GetQuests(request))

def JsonUsers(request):
    global mud
    return HttpResponse(mud.GetUsers(request))

def JsonMessages(request):
    global mud
    return HttpResponse(mud.GetMessages(request))


