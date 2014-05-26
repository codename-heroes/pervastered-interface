from django.conf.urls.defaults import *
from django.http import HttpResponseRedirect
from Logger.api import *
from Logger.settings import *
from Logger.main import *



urlpatterns = patterns('django.views.generic.simple',
    # WEB METHODS
    (r'^updaters/edit/(\d*)', EditUpdater),
    (r'^updaters', ShowUpdaters),
    (r'^test', Test),

    # API METHODS
    (r'^api/events/validate/(.*)', EventsValidate),
    (r'^api/events', ApiEvents),
    (r'^api/events/(.*)', ApiEvent),
    (r'^api/trigger_errors/(.*)', TriggerErrors),
    (r'^api/updaters/grabbers/result/(.*)', UpdaterGrabbersResult),
    (r'^api/loop', CheckUpdaters),
    (r'^index', Index)
)

if DEBUG:
    urlpatterns += patterns('',
        (r'^'+'static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': STATIC_LOCATION}),
        (r'^'+'js/(?P<path>.*)$', 'django.views.static.serve', {'document_root': STATIC_LOCATION+"/js/"}),
        (r'^'+'img/(?P<path>.*)$', 'django.views.static.serve', {'document_root':STATIC_LOCATION+"/img/"}),
        (r'^'+'css/(?P<path>.*)$', 'django.views.static.serve', {'document_root': STATIC_LOCATION+"/css/"}),
    )