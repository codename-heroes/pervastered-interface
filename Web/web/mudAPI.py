from datetime import datetime
import time
import json


import threading

class AsyncoreThread(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)

    def run(self):
        asyncore.loop()


'''
MUD API
'''
class MUD:
    proxy = None
    incoming_responses = {}
    commands = {}

    def __init__(self):
        self.proxy = Proxy(self)

    def GetQuests(self, request):
        result = self.SendAndWait(request, "; $hero_utils:list_quests()", ValidateJSON)

        return result

    def GetQuest(self, request, quest):

        #result = self.SendAndWait(request, "; $hero_utils:quest_info("+quest+")\r\n", ValidateJSON)

        return HttpResponse(quest)

    def GetUsers(self, request):
        result = self.SendAndWait(request, "; $hero_utils:list_users()", ValidateJSON)

        return result

    def GetUser(self, request, user):
        result = self.SendAndWait(request, "; $hero_utils:user_info("+ user +",1)", ValidateJSON)

        return result

    def GetRitual(self, request, ritual):
        result = self.SendAndWait(request, "; $hero_utils:ritual_info("+ritual+",1)", ValidateJSON)

        return result

    def GetRituals(self, request):
        result = self.SendAndWait(request, "; $hero_utils:list_rituals()", ValidateJSON)

        return result

    def GetMessages(self, request):
        result = self.SendAndWait(request, "; $hero_utils:list_messages()", ValidateJSON)

        return result

    def GetMessage(self, request, message):
        result = self.SendAndWait(request, "; $hero_utils:message_info("+ message + ",1)", ValidateJSON)

        return result

    def GetUnknown(self, request, element):
        result = self.SendAndWait(request, "; $hero_utils:unknown_info("+ element + ",1)", ValidateJSON)

        return result

    def SendAndWait(self, request, command, receiver):
        command += "\r\n"

        id = str(datetime.now()) + request.META['REMOTE_ADDR']
        self.incoming_responses[id] = receiver
        self.commands[id] = command

        while not self.proxy.mooSocket.connection_stablished:
            time.sleep(0.1)
            print "WAITING to stablish connection"

        self.proxy.send_message(command, id)
        print "SENDING (",id,")", command

        while self.incoming_responses[id] == receiver:
            if self.incoming_responses[id] == None:
                print "ERROR, sending command again"
                self.incoming_responses[id] = receiver
                self.proxy.send_message(command, id)
            print "WAITING response"
            time.sleep(0.1)

        result = self.incoming_responses[id]
        del self.incoming_responses[id]
        del self.commands[id]

        return result


def ValidateJSON(message):
    begin = message.find("=> ")
    print "validating JSON", begin
    if begin != -1:
        end = message.rfind("\"")
        message = message[len("=> '"):end].replace("\\\"","\"")
        print "MESSAGE", message
        auxJson = json.loads(message)
        print "MESSAGE", message
        return message
    else:
        return None

class Proxy:
    host = 'ec2-46-51-150-16.eu-west-1.compute.amazonaws.com'
    port = 7777
    mooSocket = None
    asyncore_thread = AsyncoreThread()
    receiver = None
    mud = None

    def __init__(self, mud):
        self.mud = mud
        if self.mooSocket is None:
            self.mooSocket = Client(self.host, self.port,"connect Yojimbo yojimbo\r\n")
            self.mooSocket.receiver = self.receive
            self.asyncore_thread.start()

    def connect(self):
        self.mooSocket.moo_connect()

    def send_message(self, message, receiver = None):
        self.receiver = receiver
        self.mooSocket.send(message)

    def receive(self, message):
        if self.receiver:
            try:
                print self.mud.incoming_responses[self.receiver]
                self.mud.incoming_responses[self.receiver] = self.mud.incoming_responses[self.receiver](message)
                self.receiver = None
            except:
                self.mud.incoming_responses[self.receiver] = None


import asyncore, socket

class Client(asyncore.dispatcher_with_send):
    receiver = None
    connection_stablished = False
    in_buffer = ""
    def __init__(self, host, port, message):
        asyncore.dispatcher.__init__(self)
        self.create_socket(socket.AF_INET, socket.SOCK_STREAM)
        self.out_buffer = message
        self.connect((host, port))

    def handle_close(self):
        self.close()

    def handle_read(self):
        data = self.recv(1000000)
        #print "RECEIVE:",data
        if "#$#mcp version: 2.1 to: 2.1 " in data:
            self.send("#$#mcp authentication-key: 22 version: 1.0 to: 2.1\r\n")
            self.send("#$#mcp-negotiate-can 22 package: websocket-access min-version: 1.0 max-version: 1.0\r\n")
            self.send("#$#mcp-negotiate-end 22\r\n")
            print "mcp negotiation"
            return
        elif "#$#mcp-negotiate-end" in data:
            print "mcp-end"
            self.connection_stablished = True
            return
        elif "=> " in data:
            self.in_buffer = data
        elif len(self.in_buffer) > 0:
            self.in_buffer += data

        if "\r\n" in self.in_buffer:
            if self.receiver:
                print "RECEIVED ", self.in_buffer
                self.receiver(self.in_buffer)
                self.in_buffer = ""


    def handle_connect(self):
        print "connect and send"


