//TODO MVP 1.0 DEMO Emisor/Receptores. Permite usar funcionalidad principal de emitir/recibir audio
//2024.06.12 Google Icons. Codepen.io(Iconos) Font Awesome
//* usar misma pantalla para publicar/reproducir un solo boton
//* reproducir micro en tiempo real
//* incluir botón compartir nativo
//* incluir visualizacion grafica de audio en grafica de barras
//* seleccionar canal de entrada (micro, fichero, reproduccion, linea de entrada aux.)
//* configurar PWA nativa

//TODO MVP 2.0 PLATAFORMA. Permite usar plataforma y monetizar SAAS
//* login emisor https://codepen.io/marcobiedermann/pen/nbpKWV
//* login receptor
//* configurar usuario, y parametros emision (titulo, subtitulos, guardar, canal publico)
//* configurar receptor, y parametros receptor (guardados, favoritos, etc)
//* guardar audios de ultima semana publicados 
//* guardar audios favoritos de usuario

//TODO MVP 3.0 AUDIO MEJORADO. Permite funcionalidades mejoradas para usuarios
//* mejorar audio de envio en cliente
//* mejorar audio de reproduccion al usuario (frecuencias, ruido, silencio, velocidad)
//* incluir subtitulos en tiempo real (whisper) 
//* incluir text2audio de subitulos para mejorar sonido 
//* incluir traducción simultanea a distintos idiomas
//* incluir elementos multimedia (texto, imagenes, video, etc)

console.log("js start");
import {WebRTCAdaptor} from "https://cdn.skypack.dev/@antmedia/webrtc_adaptor";

//The URL where you publish and play the stream
let websocketURL = "wss://ovh36.antmedia.io:5443/WebRTCAppEE/websocket"
let streamId = "JE" + parseInt(Math.random()*999999);
let webRTCAdaptorPublisher;
let webRTCAdaptorPlayer;

let publish_audio_button = document.getElementById("publish_audio_button");
let play_audio_button = document.getElementById("play_audio_button");
let status_label = document.getElementById("status_label");
let compartir_label = document.getElementById("compartir_label");
const micContainer = document.getElementById('mic-container');
const playContainer = document.getElementById('play-container');

let docURL = document.URL;
console.log(docURL);

//configurar emisor/receptor con parámetros URL
//* Emisor(sin parametro)    /demo.html
//* Receptor con parametro   /demo.html?s=JE616400
publish_audio_button.disabled = true;
play_audio_button.disabled = true;
const valores = window.location.search;
const urlParams = new URLSearchParams(valores);
const isPlayer = urlParams.has('s');
let isActive = false;

if (isPlayer) {
	streamId = urlParams.get('s');
	play_audio_button.disabled = false;
	play_audio_button.style.visibility = 'visible';
	playContainer.style.visibility = 'visible';
} else {
	publish_audio_button.disabled = false;
	micContainer.style.visibility = 'visible';
}

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
						console.log("publish initialized");
						publish_audio_button.disabled = false;
						webRTCAdaptorPublisher.publish(streamId);
					} else if (info == "publish_started") {
						//stream is being published
						console.log("publish started");
            status_label.innerText = "Status:Publishing";
            compartir_label.href = docURL+"?s="+streamId;
//						compartir_label.target = "_blank";  //abrir en otra pestaña
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
						console.log("publish play started");
            play_audio_button.innerText = "Stop Playing";
          }
          else if (info == "play_finished") {
						console.log("publish play finished");
            play_audio_button.innerText = "Play";
          }
					else if (info == "closed") {
            play_audio_button.disabled = true
            publish_audio_button.disabled = true;
						console.log("publish closed");
						if (typeof description != "undefined") {
							console.log("publish connection closed: " + JSON.stringify(description));
						}
					}
				},
				callbackError: function (error, message) {
					//some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
           console.log("publish error is " + error + " message: " + message);
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
						console.log("play initialized");
            webRTCAdaptorPlayer.play(streamId);
					}
          else if (info == "play_started"){
						console.log("play started");
            play_audio_button.innerText = "Stop Playing";
          }
          else if (info == "play_finished") {
						console.log("play finished");
            play_audio_button.innerText = "Play";
          }
					else if (info == "closed") {
            play_audio_button.disabled = true
						console.log("play closed");
						if (typeof description != "undefined") {
							console.log("play connection closed: " + JSON.stringify(description));
						}
					}
				},
				callbackError: function (error, message) {
					//some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
           console.log("play error is " + error + " message: " + message);
					//errorHandler(error, message);
				}
			});
}

/*
//Compartir de forma nativa desde web mediante Click sobre elemento Share
var nativeShare = function() {
  if (navigator.share) {
    navigator.share({ title: "JustEar", text: "Player", url: docURL+"?s="+streamId })
  }
  return false;
}

let share = document.getElementById("Share");
share.addEventListener("click", () => {
	console.log("Share is clicked");
  nativeShare();
});
*/

publish_audio_button.addEventListener("click", () => {
	console.log("publish audio button is clicked");
  if (publish_audio_button.innerText == "Publish") {
	  mergeAndPublishAudio();
  }
  else {
    webRTCAdaptorPublisher.stop(streamId);
  }
});

//https://dribbble.com/shots/5308631-Voice-recorder
//const micContainer = document.getElementsByClassName('mic-container')[0];
//const micContainer = document.getElementById('mic-container');
micContainer.addEventListener('click', (e)=> {
  let elem = e.target;
  elem.classList.toggle('active');

	console.log("publishContainer is clicked");
  if (publish_audio_button.innerText == "Publish") {
	  mergeAndPublishAudio();
  }
  else {
    webRTCAdaptorPublisher.stop(streamId);
  }

});

play_audio_button.addEventListener("click", ()=> {
	console.log("play audio button is clicked");
  if (play_audio_button.innerText == "Play") {
     play();
  }
  else {
    webRTCAdaptorPlayer.stop(streamId);
  }
});


//https://dribbble.com/shots/5308631-Voice-recorder
//const playContainer = document.getElementById('play-container');
console.log(playContainer);
playContainer.addEventListener('click', (e)=> {
  console.log("playContainer is clicked");
  let elem = e.target;

  if (play_audio_button.innerText == "Play") {
		play();
 }
 else {
	 webRTCAdaptorPlayer.stop(streamId);
 }

  elem.classList.toggle('active');
	console.log(elem.classList);
 });

 const boton = document.getElementById('boton');
 boton.addEventListener('click', (e)=> {
  console.log("boton is clicked");
  let elem = e.target;
	elem.classList.toggle('active');

	isActive = !isActive;

});
 
/*
audio.onended = function() {
     $("#play-pause-button").removeClass('fa-pause');
     $("#play-pause-button").addClass('fa-play');
};
*/

console.log("js end");
