'use strict';

var Screenshot= document.getElementById('Screenshot');
var Start = document.getElementById('Start');
var Call = document.getElementById('Call');
var HangUp = document.getElementById('HangUp');
var Start_Time;
var Host_Video = document.getElementById('Host_Video');
var Remote_User_Video = document.getElementById('Remote_User_Video');
var Host_Stream;
var Anurag;
var Dharmik;
var servers = null;
var filterSelect = document.querySelector('select#filter');
Call.disabled = true;
HangUp.disabled = true;
Start.onclick = start;
Call.onclick = call;
HangUp.onclick = hangup;
Screenshot.onclick = screenshot;


var canvas = window.canvas = document.querySelector('canvas');
canvas.width = 480;
canvas.height = 360;


filterSelect.onchange = function() {
  Remote_User_Video.className = filterSelect.value;
};

function screenshot() {
  canvas.className = filterSelect.value;
  canvas.getContext('2d').drawImage(Remote_User_Video, 0, 0, canvas.width, canvas.height);
};

var constraints = {
  audio: false,
  video: true
};


function handleError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

navigator.mediaDevices.getUserMedia(constraints).
    then(handleSuccess).catch(handleError);


Host_Video.addEventListener('loadedmetadata', function() {
  trace('Local video videoWidth: ' + this.videoWidth +
    'px,  videoHeight: ' + this.videoHeight + 'px');
});

Remote_User_Video.addEventListener('loadedmetadata', function() {
  trace('Remote video videoWidth: ' + this.videoWidth +
    'px,  videoHeight: ' + this.videoHeight + 'px');
});

Remote_User_Video.onresize = function() {
  trace('Remote video size changed to ' +
    Remote_User_Video.videoWidth + 'x' + Remote_User_Video.videoHeight);
  
  if (Start_Time) {
    var Elapsed_Time = window.performance.now() - Start_Time;
    trace('Setup time: ' + Elapsed_Time.toFixed(3) + 'ms');
    Start_Time = null;
  }
};


var Show_Options = {
  receive_audio: 1,
  receive_audio: 1
};

function get_name(pc) {
  return (pc === Anurag) ? 'Anurag' : 'Dharmik';
}

function getOtherPc(pc) {
  return (pc === Anurag) ? Dharmik : Anurag;
}

function received_local_stream(stream) {
  trace('Received local stream');
  Host_Video.srcObject = stream;
  
  window.Host_Stream = Host_Stream = stream;
  Call.disabled = false;
}

function start() {
  trace('Requesting local stream');
  Start.disabled = true;
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  })
  .then(received_local_stream)
  .catch(function(z) {
    alert('getUserMedia() error: ' + z.name);
  });
}

function call() {
  Call.disabled = true;
  HangUp.disabled = false;
  trace('Starting call');
  Start_Time = window.performance.now();
  var videoTracks = Host_Stream.getVideoTracks();
  var audioTracks = Host_Stream.getAudioTracks();
  if (videoTracks.length > 0) {
    trace('Using video device: ' + videoTracks[0].label);
  }
  if (audioTracks.length > 0) {
    trace('Using audio device: ' + audioTracks[0].label);
  }
  
  
  window.Anurag = Anurag = new RTCPeerConnection(servers);
  trace('Created local peer connection object Anurag');
  Anurag.onicecandidate = function(z) {
    onIceCandidate(Anurag, z);
  };
  
  window.Dharmik = Dharmik = new RTCPeerConnection(servers);
  trace('Created remote peer connection object Dharmik');
  Dharmik.onicecandidate = function(z) {
    onIceCandidate(Dharmik, z);
  };
  Anurag.oniceconnectionstatechange = function(z) {
    onIceStateChange(Anurag, z);
  };
  Dharmik.oniceconnectionstatechange = function(z) {
    onIceStateChange(Dharmik, z);
  };
  Dharmik.onaddstream = gotRemoteStream;

  Anurag.addStream(Host_Stream);
  trace('Added local stream to Anurag');

  trace('Anurag createOffer start');
  Anurag.createOffer(
    Show_Options
  ).then(
    onCreateOfferSuccess,
    onCreateSessionDescriptionError
  );
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function onCreateOfferSuccess(desc) {
  trace('Offer from Anurag\n' + desc.sdp);
  trace('Anurag setLocalDescription start');
  Anurag.setLocalDescription(desc).then(
    function() {
      onSetLocalSuccess(Anurag);
    },
    onSetSessionDescriptionError
  );
  trace('Dharmik setRemoteDescription start');
  Dharmik.setRemoteDescription(desc).then(
    function() {
      onSetRemoteSuccess(Dharmik);
    },
    onSetSessionDescriptionError
  );
  trace('Dharmik createAnswer start');
  
  Dharmik.createAnswer().then(
    onCreateAnswerSuccess,
    onCreateSessionDescriptionError
  );
}

function onSetLocalSuccess(pc) {
  trace(get_name(pc) + ' setLocalDescription complete');
}

function onSetRemoteSuccess(pc) {
  trace(get_name(pc) + ' setRemoteDescription complete');
}

function onSetSessionDescriptionError(error) {
  trace('Failed to set session description: ' + error.toString());
}

function gotRemoteStream(z) {
  window.remoteStream = Remote_User_Video.srcObject = z.stream;
  trace('Dharmik received remote stream');
}

function onCreateAnswerSuccess(desc) {
  trace('Answer from Dharmik:\n' + desc.sdp);
  trace('Dharmik setLocalDescription start');
  Dharmik.setLocalDescription(desc).then(
    function() {
      onSetLocalSuccess(Dharmik);
    },
    onSetSessionDescriptionError
  );
  trace('Anurag setRemoteDescription start');
  Anurag.setRemoteDescription(desc).then(
    function() {
      onSetRemoteSuccess(Anurag);
    },
    onSetSessionDescriptionError
  );
}

function onIceCandidate(pc, event) {
  if (event.candidate) {
    getOtherPc(pc).addIceCandidate(
      new RTCIceCandidate(event.candidate)
    ).then(
      function() {
        onAddIceCandidateSuccess(pc);
      },
      function(err) {
        onAddIceCandidateError(pc, err);
      }
    );
    trace(get_name(pc) + ' ICE candidate: \n' + event.candidate.candidate);
  }
}

function onAddIceCandidateSuccess(pc) {
  trace(get_name(pc) + ' addIceCandidate success');
}

function onAddIceCandidateError(pc, error) {
  trace(get_name(pc) + ' failed to add ICE Candidate: ' + error.toString());
}

function onIceStateChange(pc, event) {
  if (pc) {
    trace(get_name(pc) + ' ICE state: ' + pc.iceConnectionState);
    console.log('ICE state change event: ', event);
  }
}

function hangup() {
  trace('Ending call');
  Anurag.close();
  Dharmik.close();
  Anurag = null;
  Dharmik = null;
  HangUp.disabled = true;
  Call.disabled = false;
}


function trace(text) {
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() *0.001).toFixed(3);
    console.log(now + ': ' + text);
  } else {
    console.log(text);
  }
}
