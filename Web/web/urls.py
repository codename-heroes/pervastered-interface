from django.conf.urls.defaults import *
from web.main import *
from web.settings import *
from django.http import HttpResponseRedirect

urlpatterns = patterns('django.views.generic.simple',

    (r'^robots\.txt$', lambda r: HttpResponseRedirect(settings.STATIC+"robots.txt")),
    (r'^map', Map),
    (r'^players', Players),
    (r'^stats', Stats),
    (r'^home', Home),
    (r'^quests', Quests),
    (r'^messages', Messages),
    (r'^rituals', Rituals),
    (r'^locations', Locations),
    (r'^api/user/(.*)', GetUser),
    (r'^api/message/(.*)', GetMessage),
    (r'^api/ritual/(.*)', GetRitual),
    (r'^api/(.*)', GetUnknown),
    (r'^json/ritual/(.*)', JsonRitual),
    (r'^json/message/(.*)', JsonMessage),
    (r'^json/user/(.*)', JsonUser),
    (r'^json/quest/(.*)', JsonQuest),
    (r'^json/rituals', JsonRituals),
    (r'^json/messages', JsonMessages),
    (r'^json/quests', JsonQuests),
    (r'^json/users', JsonUsers),
    (r'^json/(.*)', JsonUnknown),
    (r'^test', Test),


    #(r'^test', Test),
    (r'^$', Home),

)

#Static file serving for the development server
if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^'+settings.BASEPATH+'static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_LOCATION}),
        (r'^'+settings.BASEPATH+'img/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_LOCATION+"img/"}),
        (r'^'+settings.BASEPATH+'css/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_LOCATION+"css/"}),
        (r'^'+settings.BASEPATH+'js/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_LOCATION+"js/"}),
        (r'^'+settings.BASEPATH+'font/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.STATIC_LOCATION+"font/"}),
    )