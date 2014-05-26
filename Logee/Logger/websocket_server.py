import sys

from twisted.python import log
from autobahn.websocket import WebSocketServerFactory, WebSocketServerProtocol, listenWS
from autobahn.wamp import exportSub, exportPub, WampServerFactory, WampServerProtocol


class LogeeTopicService:
    def __init__(self, validator):
        self.validator = validator

    @exportSub("namespace:", True)
    def subscribe(self, topicUriPrefix, topicUriSuffix):
        print "client wants to subscribes to %s%s" % (topicUriPrefix, topicUriSuffix)
        try:
            if self.validator.checkSubscribe(topicUriSuffix):
                print "Subscribing client to topic %s" % topicUriSuffix
                return True
            else:
                print "Client not allowed to subscribe to topic %s" % topicUriSuffix
                return False
        except:
            print "illegal topic - skipped subscription"
            return False


    @exportPub("namespace:", True)
    def publish(self, topicUriPrefix, topicUriSuffix, event):
        print "client wants to publish to %s-%s" % (topicUriPrefix, topicUriSuffix)
        try:
            if self.validator.checkPublish(topicUriSuffix, event):
                print "sending event "
                return event["content"]
            else:
                print "event is not dict or misses count attribute"
                return None
        except:
            print "illegal topic - skipped publication of event"
            return None


class AbstractPubSubValidator():
    def checkPublish(self, topic, event):
        return True

    def checkSubscribe(self, topic):
        return True


# PARTICULAR IMPLEMENTATION IN LOGEE
class LogeeValidator(AbstractPubSubValidator):
    def checkPublish(self, topic, event):
        # We don't allow publishing of any kind, just one way communication
        return False
        #return self.checkTopic(topic) and self.checkEvent(event)

    def checkSubscribe(self, topic):
        return self.checkTopic(topic)

    def checkTopic(self, topic):
        namespaceEvent = str(topic).split('/')

        return (len(namespaceEvent) == 2 and self.checkEventType(namespaceEvent[0], namespaceEvent[1])) or \
                self.checkNamespace(namespaceEvent[0])

    def checkEvent(self, event):
        return type(event) == dict and event.has_key("id") and event.has_key("content")

    def checkNamespace(self, namespace):
        from Logger.models import Namespace
        return len(Namespace.objects.all().filter(name=namespace)) > 0

    def checkEventType(self, namespace, event):
        from Logger.models import EventType
        return len(EventType.objects.all().filter(name=event, namespace__name=namespace)) > 0

class LogeeProtocol(WampServerProtocol):
    def onSessionOpen(self):
        self.topicservice = LogeeTopicService(LogeeValidator())
        self.registerHandlerForPubSub(self.topicservice, "")

class WebSocketServer():
    server = None

    def __init__(self, port, debug):
        if debug:
            log.startLogging(sys.stdout)

        self.server = WampServerFactory("ws://localhost:"+ str(port), debug)
        self.server.protocol = LogeeProtocol
        listenWS(self.server)

    def broadcast(self, topic, message):
        self.server.dispatch(topic, message)
