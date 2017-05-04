import sys
sys.path.append("/root/Downloads/most-voip-master/python/src")
from most.voip.api import VoipLib
from most.voip.api import *
from most.voip.api_backend import *
from most.voip.constants import VoipEvent

import time

my_voip=VoipLib()

voip_params = { 'username' : raw_input("Enter Username :"),
		'sip_server_address' : '192.168.1.33',
		'sip_server_user' : input("Enter Server Username :"),
		'sip_server_pwd' : raw_input("Enter password :"),
		'sip_server_transport' : 'udp',
		'log_level': 1,
		'debug': False
		}


import time
end_of_call = False

# implement a method that will capture all the events triggered by the Voip Library
def notify_events(voip_event_type, voip_event, params):
	print "Received Event Type:%s -> Event: %s Params: %s" % (voip_event_type, voip_event, params)

	# event triggered when the account registration has been confirmed by the remote Sip Server
	if (voip_event==VoipEvent.ACCOUNT_REGISTERED):
	        print "Account %s registered: ready to accept call!" % my_voip.get_account().get_uri()

	# event triggered when a new call is incoming
	elif (voip_event==VoipEvent.CALL_INCOMING):
	        print "INCOMING CALL From %s" % params["from"]
		time.sleep(2)
	        print "Answering..."
		my_voip.answer_call()
	
	# event triggered when the call has been established
	elif(voip_event==VoipEvent.CALL_ACTIVE):
        	print "The call with %s has been established"  % my_voip.get_call().get_remote_uri()
	  	dur = 4
	        print "Waiting %s seconds before hanging up..."  % dur
	        time.sleep(dur)
	        my_voip.hangup_call()

	# events triggered when the call ends for some reasons
 	elif (voip_event in [VoipEvent.CALL_REMOTE_DISCONNECTION_HANGUP, VoipEvent.CALL_REMOTE_HANGUP, VoipEvent.CALL_HANGUP]):
       	 	print "End of call. Destroying lib..."
        	my_voip.destroy_lib()

	# event triggered when the library was destroyed
   	elif (voip_event==VoipEvent.LIB_DEINITIALIZED):
        	print "Call End. Exiting from the app."
        	end_of_call = True
	# just print informations about other events triggered by the library
    	else:
        	print "Received unhandled event type:%s --> %s" % (voip_event_type,voip_event)


my_voip.init_lib(voip_params, notify_events)


my_voip.register_account()

extension=raw_input("Do you want to call user 2001 y/n?")
if extension == 'Y' or extension == 'y':

	my_extension = "2001"
	my_voip.make_call(my_extension)


	# wait until the call is active
	while (end_of_call==False):
		time.sleep(2)


else:
	# ends the current call
	my_voip.hangup_call()


my_voip.hangup_call()
