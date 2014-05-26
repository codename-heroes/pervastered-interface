from django.http import HttpResponse
from django.utils import simplejson
from django.core.exceptions import PermissionDenied
from django.template.loader import get_template
from django.template import Context

'''
======== UTILS ==========
'''

def jsonResponse(response):
    response = HttpResponse(simplejson.dumps(response, indent=4), mimetype="application/json")
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS, UPDATE"
    response["Access-Control-Max-Age"] = "1000"
    response["Access-Control-Allow-Headers"] = "*, Content-Type"
    return response


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
        'user': request.user,
        }
    values.update(template_values)
    t = get_template(template_name)

    return HttpResponse(t.render(Context(values)))



import threading

class TimeoutError(RuntimeError):
    pass

class AsyncCall(object):
    def __init__(self, fnc, callback = None):
        self.Callable = fnc
        self.Callback = callback

    def __call__(self, *args, **kwargs):
        self.Thread = threading.Thread(target = self.run, name = self.Callable.__name__, args = args, kwargs = kwargs)
        self.Thread.setDaemon(True)
        self.Thread.start()
        return self

    def wait(self, timeout = None):
        self.Thread.join(timeout)
        if self.Thread.isAlive():
            raise TimeoutError()
        else:
            return self.Result

    def run(self, *args, **kwargs):
        self.Result = self.Callable(*args, **kwargs)
        if self.Callback:
            self.Callback(self.Result)

class AsyncMethod(object):
    def __init__(self, fnc, callback=None):
        self.Callable = fnc
        self.Callback = callback

    def __call__(self, *args, **kwargs):
        return AsyncCall(self.Callable, self.Callback)(*args, **kwargs)

def Async(fnc = None, callback = None):
    if fnc == None:
        def AddAsyncCallback(fnc):
            return AsyncMethod(fnc, callback)
        return AddAsyncCallback
    else:
        return AsyncMethod(fnc, callback)

