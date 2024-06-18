console.log("demo.js start");
import {WebRTCAdaptor} from "https://cdn.skypack.dev/@antmedia/webrtc_adaptor@SNAPSHOT";

var mediaConstraints = {
		video: false,
		audio: true
	};

	
 var websocketURL = "wss://test.antmedia.io/WebRTCAppEE/websocket"

var stream1Id = "stream" + Math.floor(Math.random() * 1000);
var stream2Id = "stream" + Math.floor(Math.random() * 1000);

document.getElementById("localAudio1Id").innerHTML =  stream1Id;
document.getElementById("localAudio2Id").innerHTML = stream2Id;

var webRTCAdaptor1 = new WebRTCAdaptor ({
		websocket_url: websocketURL,
		mediaConstraints: mediaConstraints,
		localVideoId: "localAudio1",
		debug: true,
		callback: function (info, description) {
			if (info == "initialized") {
				console.log("initialized");
        document.getElementById("toggleButton").disabled = false
			} else if (info == "publish_started") {
				//stream is being published
				console.log("publish started");
        document.getElementById("status1").innerHTML = "Publishing"
        
			} else if (info == "publish_finished") {
				console.log("publish finished");
         document.getElementById("status1").innerHTML = "Idle"
			}
			else if (info == "closed") {
				console.log("Connection closed");
         document.getElementById("status1").innerHTML = "Idle"
			}
		},
		callbackError: function (error, message) {
			//some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
      alert("error: " + error + " message:" + message);

		}
	});

//currently Ant Media Server accepts one streams from the same webrtc session so we create the second webrtc adaptor
var webRTCAdaptor2 = new WebRTCAdaptor ({
		websocket_url: websocketURL,
		mediaConstraints: mediaConstraints,
		localVideoId: "localAudio2",
		debug: true,
		callback: function (info, description) {
			if (info == "initialized") {
				console.log("initialized");
			} else if (info == "publish_started") {
				//stream is being published
				console.log("publish started");
         document.getElementById("status2").innerHTML = "Publishing"
			} else if (info == "publish_finished") {
				console.log("publish finished");
         document.getElementById("status2").innerHTML = "Idle"
			}
			else if (info == "closed") {
				console.log("Connection closed");
         document.getElementById("status2").innerHTML = "Idle"
			}
		},
		callbackError: function (error, message) {
			//some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
      alert("error: " + error + " message:" + message);

		}
	});

//just a dummy check
var isPublishing = false;

document.getElementById("toggleButton").addEventListener("click", 
function togglePublishing() {
  
  if (!isPublishing) {
    webRTCAdaptor1.publish(stream1Id);
    webRTCAdaptor2.publish(stream2Id);
    document.getElementById("toggleButton").innerHTML = "Stop";
  }
  else {
     webRTCAdaptor1.stop(stream1Id);
     webRTCAdaptor2.stop(stream2Id);
     document.getElementById("toggleButton").innerHTML = "Start";
  }
  isPublishing = !isPublishing;
});});console.log("demo.js end");
