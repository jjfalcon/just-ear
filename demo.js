import {WebRTCAdaptor} from "https://cdn.skypack.dev/@antmedia/webrtc_adaptor";

//The URL where you publish and play the stream
let websocketURL = "wss://ovh36.antmedia.io:5443/WebRTCAppEE/websocket"
let streamId = "stream20240606";// + parseInt(Math.random()*999999);
var webRTCAdaptorPublisher;
var webRTCAdaptorPlayer;

var publish_audio_button = document.getElementById("publish_audio_button");
var play_audio_button = document.getElementById("play_audio_button");
var status_label = document.getElementById("status_label");
publish_audio_button.addEventListener("click", () => {
	console.log("publish audio button is clicked");
  if (publish_audio_button.innerText == "Publish") {
	  mergeAndPublishAudio();
  }
  else {
    webRTCAdaptorPublisher.stop(streamId);
  }
});

play_audio_button.addEventListener("click", ()=> {
  if (play_audio_button.innerText == "Play") {
     play();
  }
  else {
    webRTCAdaptorPlayer.stop(streamId);
  }
});

function mergeAndPublishAudio() {

			const mergedAudio = document.getElementById('merged_audio');

			// Create an AudioContext
			const audioContext = new (window.AudioContext || window.webkitAudioContext)();

			// Create AudioBufferSourceNodes for each audio element
			const source1 = audioContext.createBufferSource();
			const source2 = audioContext.createBufferSource();

			const audioDestination = audioContext.createMediaStreamDestination();

			// Load audio data from the audio elements
			const audio1Url = "https://mekya.github.io/samples/stereo/adele_audio_mono.mp3";
			const audio2Url = "https://mekya.github.io/samples/stereo/michael_jackson_audio_mono.mp3";

			fetch(audio1Url)
				.then(response => response.arrayBuffer())
				.then(buffer => audioContext.decodeAudioData(buffer))
				.then(decodedData => {
					// Set the audio data for the first source node
					source1.buffer = decodedData;

					fetch(audio2Url)
						.then(response => response.arrayBuffer())
						.then(buffer => audioContext.decodeAudioData(buffer))
						.then(decodedData => {
							// Set the audio data for the second source node
							source2.buffer = decodedData;
							//source2.connect(audioDestination);

							// Create a ChannelMergerNode to merge the audio sources
							const merger = audioContext.createChannelMerger(2);

							// Connect the sources to the merger
							source1.connect(merger, 0, 0);
							source2.connect(merger, 0, 1);

							// Connect the merger to the destination (speakers/headphones)
							//merger.connect(audioDestination);
							merger.connect(audioDestination);
							mergedAudio.srcObject = audioDestination.stream;

							source1.start(0);
							source2.start(0);
							publish(audioDestination.stream);
						});
				});
}
function publish(stream) {

			webRTCAdaptorPublisher = new WebRTCAdaptor({
				websocket_url: websocketURL,
				localStream: stream,
				debug: true,
				callback: function (info, description) {
					if (info == "initialized") {
						console.log("initialized");
						publish_audio_button.disabled = false;
						webRTCAdaptorPublisher.publish(streamId);
					} else if (info == "publish_started") {
						//stream is being published
						console.log("publish started");
            status_label.innerText = "Status:Publishing";
            publish_audio_button.innerText = "Stop Publishing"
						play_audio_button.disabled = false;
					} else if (info == "publish_finished") {
						//stream is being finished
						console.log("publish finished");
             status_label.innerText = "Status:Offline";
            publish_audio_button.innerText = "Publish"
						publish_audio_button.disabled = false;
            play_audio_button.disabled = true;
					}
          else if (info == "play_started"){
            play_audio_button.innerText = "Stop Playing";
          }
          else if (info == "play_finished") {
            play_audio_button.innerText = "Play";
          }
					else if (info == "closed") {
            play_audio_button.disabled = true
            publish_audio_button.disabled = true;
						//console.log("Connection closed");
						if (typeof description != "undefined") {
							console.log("Connecton closed: " + JSON.stringify(description));
						}
					}
				},
				callbackError: function (error, message) {
					//some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
           console.log("error is " + error + " message: " + message);
					//errorHandler(error, message);
				}
			});
		}

function play() {
  webRTCAdaptorPlayer = new WebRTCAdaptor({
				websocket_url: websocketURL,
				remoteVideoElement: document.getElementById("remote_audio"),
				debug: true,
        isPlayMode : true,
				callback: function (info, description) {
					if (info == "initialized") {
						console.log("initialized");
            webRTCAdaptorPlayer.play(streamId);
					}
          else if (info == "play_started"){
            play_audio_button.innerText = "Stop Playing";
          }
          else if (info == "play_finished") {
            play_audio_button.innerText = "Play";
          }
					else if (info == "closed") {
            play_audio_button.disabled = true
						//console.log("Connection closed");
						if (typeof description != "undefined") {
							console.log("Connecton closed: " + JSON.stringify(description));
						}
					}
				},
				callbackError: function (error, message) {
					//some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
           console.log("error is " + error + " message: " + message);
					//errorHandler(error, message);
				}
			});
}