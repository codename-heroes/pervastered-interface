from Logger.utils import Async
from twisted.internet import reactor
from Logger.websocket_server import WebSocketServer
from Logger.websocket_client import WebSocketClient

class Singleton(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]

class RealtimeAPI():
    __metaclass__ = Singleton

    client = None
    server = None
    URI = "namespace:"

    def initServer(self, port, debug):
        try:
            self.server = WebSocketServer(port, debug)
        except :
            print "serverExcept"

        return self

    def initClient(self, port, debug):

        try:
            self.client = WebSocketClient(port, debug)
        except:
            print "clientExcept"

        return self

    @Async
    def start():
        reactor.run()

    def broadcast(self, namespace, type, event):
        general = self.URI+namespace
        self.server.broadcast(general, event)
        self.server.broadcast(general+"/"+type, event)
