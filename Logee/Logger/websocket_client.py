import sys

from twisted.python import log
from autobahn.websocket import connectWS
from autobahn.wamp import WampClientFactory,WampClientProtocol


class LogeePubSubClient(WampClientProtocol):
    def onSessionOpen(self):
        pass


class WebSocketClient():
    client = None

    def __init__(self, port, debug):
        if debug:
            log.startLogging(sys.stdout)

        self.client = WampClientFactory("ws://localhost:"+str(port), debugWamp = debug)
        self.client.protocol = LogeePubSubClient
        connectWS(self.client)

    def publish(self, topic, message):
        self.client.protocol