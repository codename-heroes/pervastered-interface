from django.db import models
from django.contrib.auth.models import User, UserManager
from time import mktime
from django.utils import simplejson
import sys

class Namespace(models.Model):
    name = models.CharField(max_length=100, unique=True)
    info = models.CharField(max_length=300, null=True, blank=True)
    mail = models.EmailField(null=True, blank=True)

    def __unicode__(self):
        return self.name

    def json(self):
        return {
            "id" : str(self.id),
            "name" : self.name,
            "info" : self.info
        }

class LogObject(models.Model):
    external_identifier = models.CharField(max_length=300)
    info = models.CharField(max_length=300, null=True, blank=True)
    namespace = models.ForeignKey(Namespace)

    def __unicode__(self):
        return "[" + self.namespace.name + "] " + self.external_identifier + " : " + str(self.info)

    class Meta:
        unique_together = (("external_identifier", "namespace"),)

    def json(self):
        return {
            "id" : str(self.id),
            "namespace" : self.namespace.json(),
            "info" : self.info,
            "external_identifier" : self.external_identifier
        }

class EventType(models.Model):
    namespace = models.ForeignKey(Namespace)
    name = models.CharField(max_length=100)

    def __unicode__(self):
        return "[" + self.namespace.name + "] " + self.name
    
    def json(self):
        return {
            "id" : str(self.id),
            "namespace" : self.namespace.json(),
            "name" : self.name
        }

    class Meta:
        unique_together = (("name", "namespace"),)

class Trigger(models.Model):
    evaluator = models.TextField()
    namespace = models.ForeignKey(Namespace)
    name = models.CharField(max_length=300)

    def __unicode__(self):
        return "[" + self.namespace.name + "] " + self.name

    def json(self):
        return {
            "id" : str(self.id),
            "name" : self.name,
            "namespace" : self.namespace.json(),
        }

METHOD_TYPES = (
    ("POST", "POST"),
    ("GET", "GET")
)

class InfoGrabber(models.Model):
    name = models.CharField(max_length=300)
    url = models.URLField(verify_exists=False)
    content = models.TextField(blank=True, null=True)
    namespace = models.ForeignKey(Namespace)
    method = models.CharField(max_length=300, choices= METHOD_TYPES, default="GET")
    priority = models.IntegerField(default=1)

    def __unicode__(self):
        return "[" + self.namespace.name + "] <" + str(self.priority) + "> " + self.name

    class Meta:
        unique_together = (("name", "namespace"),)

class Updater(models.Model):
    name = models.CharField(max_length=300)
    involved_info = models.ManyToManyField(InfoGrabber, related_name="updaters")
    triggers = models.ManyToManyField(Trigger, related_name="updaters")
    namespace = models.ForeignKey(Namespace)
    rate = models.IntegerField(blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)
    enabled = models.BooleanField(default=False)

    def __unicode__(self):
        return "[" + self.namespace.name + "] " + self.name

    class Meta:
        unique_together = (("name", "namespace"),)

class Event(models.Model):
    involved_objects = models.ManyToManyField(LogObject, related_name="events", null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    info = models.TextField(blank=True)
    type = models.ForeignKey(EventType)
    tag = models.CharField(max_length=100, null=True, blank=True)
    trigger = models.ForeignKey(Trigger, null=True, blank=True)
    namespace = models.ForeignKey(Namespace)

    def __unicode__(self):
        objects = self.involved_objects
        objects_str = ""
        if objects:
            for o in objects.all():
                objects_str += str(o)

        return "[" + self.namespace.name + "] " + self.info + " | " + objects_str

    def json(self):
        objects = []
        for o in self.involved_objects.all():
            objects.append(o.json())

        response = {}
        response["id"] = str(self.id)
        response["date"] = int(mktime(self.date.timetuple()))
        response["info"] = self.info
        response["tag"] = self.tag
        response["type"] = self.type.json()
        response["involved_objects"] = objects

        if self.trigger:
            response["trigger"] = self.trigger.json()

        if self.namespace:
            response["namespace"] = self.namespace.json()

        return response

class TriggerError(models.Model):
    trigger = models.ForeignKey(Trigger, related_name="trigger_error")
    context = models.TextField()
    evaluator = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    error = models.TextField(null=False)
    updater = models.ForeignKey(Updater)
    checked = models.BooleanField(default=False)

    def __unicode__(self):
        return "[ "+ self.trigger.namespace.name  + "] <"+ self.date.strftime("%X") +"> "+ self.trigger.name + "|" + self.error


    def json(self):
        response = {}
        response["id"] = str(self.id)
        response["date"] = int(mktime(self.date.timetuple()))
        try:
            json = self.context.encode("utf-8", "ignore").replace("\\n","").replace("\\x","").replace("':", "\":").replace("u'", "\"").replace("'","")
            response["context"] = simplejson.loads(json)
        except:
            response["context"] = self.context

        response["evaluator"] = self.evaluator
        response["error"] = self.error
        response["checked"] = self.checked

        if self.trigger:
            response["trigger"] = self.trigger.json()

        return response

class GrabberError(models.Model):
    grabber = models.ForeignKey(InfoGrabber, related_name="grabber_error")
    date = models.DateTimeField(auto_now_add=True)
    error = models.TextField(null=False)
    updater = models.ForeignKey(Updater)
    checked = models.BooleanField(default=False)

    def __unicode__(self):
        return "[ "+ self.grabber.namespace.name  + "] <"+ self.date.strftime("%X") +"> "+ self.grabber.name + "|" + self.error