//TODO MVP 1.0 DEMO Emisor/Receptores. Permite usar funcionalidad principal de emitir/recibir audio
//2024.06.12 Google Icons. Codepen.io(Iconos) Font Awesome
//2024.06.17 usar misma pantalla para publicar/reproducir un solo boton
//2024.06.17 reproducir micro en tiempo real
//2024.06.18 configurar PWA nativa
//2024.06.18 incluir botón compartir nativo
//2024.06.18 incluir visualizacion grafica de audio en grafica de barras
//* seleccionar canal de entrada (micro, fichero, reproduccion, linea de entrada aux.)

//TODO MVP 2.0 PLATAFORMA. Permite usar plataforma y monetizar SAAS
//* login emisor https://codepen.io/marcobiedermann/pen/nbpKWV
//* login receptor
//* configurar usuario, y parametros emision (titulo, subtitulos, guardar, canal publico)
//* configurar receptor, y parametros receptor (guardados, favoritos, etc)
//* guardar audios de ultima semana publicados 
//* guardar audios favoritos de usuario
//* incluir notificaciones push

//TODO MVP 3.0 AUDIO MEJORADO. Permite funcionalidades mejoradas para usuarios
//* mejorar audio de envio en cliente
//* mejorar audio de reproduccion al usuario (frecuencias, ruido, silencio, velocidad)
//* incluir subtitulos en tiempo real (whisper) 
//* incluir text2audio de subitulos para mejorar sonido 
//* incluir traducción simultanea a distintos idiomas
//* incluir elementos multimedia (texto, imagenes, video, etc)
//* incluir notificaciones con sonidos: detectar timbre puerta, portazo, alarma, etc...

console.log("js start");

//Publish and Play Audio Streams in live
//https://github.com/orgs/ant-media/discussions/5368
//import {WebRTCAdaptor} from "https://cdn.skypack.dev/@antmedia/webrtc_adaptor@SNAPSHOT";
import {WebRTCAdaptor} from "https://cdn.skypack.dev/@antmedia/webrtc_adaptor";
var mediaConstraints = {
		video: false,
		audio: true
	};

//The URL where you publish and play the stream
//let websocketURL = "wss://test.antmedia.io/WebRTCAppEE/websocket"
let websocketURL = "wss://ovh36.antmedia.io:5443/WebRTCAppEE/websocket"
let streamId = "JE" + parseInt(Math.random()*999999);
let webRTCAdaptorPublisher;
let webRTCAdaptorPlayer;

//*** Boton para compartir de forma nativa ****************************
var nativeShare = function() {
  if (navigator.share) {
    navigator.share({ title: "JustEar", text: "Player", url: docURL+"?s="+streamId })
  }
  return false;
}

let share = document.getElementById("share");
//share.style.visibility = "visible";
share.addEventListener("click", () => {
	console.log("Share is clicked");
  nativeShare();
});

//*** AUDIO LOCAL LIVE *************************************************
var webRTCAdaptorRecord = new WebRTCAdaptor ({
	websocket_url: websocketURL,
	mediaConstraints: mediaConstraints,
	localVideoId: "local_audio",
	debug: true,
	callback: function (info, description) {
		if (info == "initialized") {
		} else if (info == "publish_started") {
      compartir_label.href = docURL+"?s="+streamId;
      compartir_label.style.visibility = "visible";
      share.style.visibility = "visible";
		} else if (info == "publish_finished") {
      compartir_label.style.visibility = "hidden";
      share.style.visibility = "hidden";
		}
		else if (info == "closed") {
		}
	},
	callbackError: function (error, message) {
		//some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
		alert("error: " + error + " message:" + message);
	}
});

let audio_button = document.getElementById("audio_button");
let compartir_label = document.getElementById("compartir_label");
let docURL = document.URL;
//console.log(docURL);

//configurar emisor/receptor con parámetros URL
//* Emisor(sin parametro)    /demo.html
//* Receptor con parametro   /demo.html?s=JE616400
//publish_audio_button.disabled = true;
//play_audio_button.disabled = true;
const valores = window.location.search;
const urlParams = new URLSearchParams(valores);
const isPlayer = urlParams.has('s');
let isActive = false;

if (isPlayer) {
	streamId = urlParams.get('s');
	document.getElementById("mp3_audio").controls = true;
	document.getElementById("radio_audio").controls = true;
}

function mergeAndPublishAudio() {

	const mergedAudio = document.getElementById('remote_audio');

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
			console.log("RecordRTC: "+info);
			if (info == "initialized") {
//						console.log("publish initialized");
//						publish_audio_button.disabled = false;
				webRTCAdaptorPublisher.publish(streamId);
			} else if (info == "publish_started") {
				//stream is being published
//						console.log("publish started");
//            status_label.innerText = "Status:Publishing";
				compartir_label.href = docURL+"?s="+streamId;
				compartir_label.style.visibility = "visible";
//						compartir_label.target = "_blank";  //abrir en otra pestaña
//            publish_audio_button.innerText = "Stop Publishing"
//						play_audio_button.disabled = false;
			} else if (info == "publish_finished") {
				//stream is being finished
				compartir_label.style.visibility = "hidden";
			}
			else if (info == "play_started"){
//						console.log("publish play started");
//            play_audio_button.innerText = "Stop Playing";
			}
			else if (info == "play_finished") {
//						console.log("publish play finished");
//            play_audio_button.innerText = "Play";
			}
			else if (info == "closed") {
//            play_audio_button.disabled = true
//            publish_audio_button.disabled = true;
//						console.log("publish closed");
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
				remoteVideoElement: document.getElementById("play_audio"),
				debug: true,
        isPlayMode : true,
				callback: function (info, description) {
//					console.log("PlayRTC: "+info);
					if (info == "initialized") {
//						console.log("play initialized");
            webRTCAdaptorPlayer.play(streamId);
					}
          else if (info == "play_started"){
//						console.log("play started");
//            play_audio_button.innerText = "Stop Playing";
          }
          else if (info == "play_finished") {
//						console.log("play finished");
//            play_audio_button.innerText = "Play";
          }
					else if (info == "closed") {
//            play_audio_button.disabled = true
//						console.log("play closed");
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

/*** AUDIO_BUTTON ****************************************************/
function audio_button_update() {
	if (isPlayer) {	
		audio_button.innerText = "Play";
  } else { 
		audio_button.innerText = "Record"
  }
}
audio_button_update();
audio_button.style.visibility = "visible"

audio_button.addEventListener('click', (e)=> {
  isActive = !isActive;
	if (isActive)	{
		audio_button.innerText = "Stop....";
		if (isPlayer) {
			play();
		} else {
			//mergeAndPublishAudio();
			webRTCAdaptorRecord.publish(streamId);
		}
	}	else {
		if (isPlayer) {
			webRTCAdaptorPlayer.stop(streamId);
		}	else {
//    	webRTCAdaptorPublisher.stop(streamId);
    	webRTCAdaptorRecord.stop(streamId);
		}
		audio_button_update();
	}
});

//*** PWA service-worker*******************************************
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/service-worker.js')
			.then(registration => {
				console.log('ServiceWorker registration successful with scope: ', registration.scope);
			}, error => {
				console.log('ServiceWorker registration failed: ', error);
			});
	});
}

//*** PUSH NOTIFICACION *******************************************
//https://smilecomunicacion.com/notificaciones-push/
//https://medium.com/@greennolgaa/push-notifications-in-javascript-the-comprehensive-guide-6757f2f8ea98

//*** AUDIO INPUTs device *****************************************
//JS Audio Input Reader
//https://codepen.io/eddch/pen/ZMOjPL
(async () => {
  let micSelect = document.getElementById('micSelect');
  let stream = null;

	try {
    window.stream = stream = await getStream();
    console.log('Got stream');  
  } catch(err) {
    alert('Issue getting mic', err);
  }

  const deviceInfos = await navigator.mediaDevices.enumerateDevices();
  
  var mics = [];
  for (let i = 0; i !== deviceInfos.length; ++i) {
    let deviceInfo = deviceInfos[i];
    if (deviceInfo.kind === 'audioinput') {
      mics.push(deviceInfo);
      let label = deviceInfo.label ||
        'Microphone ' + mics.length;
      console.log('Mic ', label + ' ' + deviceInfo.deviceId)
      const option = document.createElement('option')
      option.value = deviceInfo.deviceId;
      option.text = label;
      micSelect.appendChild(option);
    }
  }
  
  function getStream(constraints) {
    if (!constraints) {
      constraints = { audio: true, video: false };
    }
    return navigator.mediaDevices.getUserMedia(constraints);
  }
})();

//*** AUDIO VISUALIZER ********************************************
//JS Audio File Visualizer
//https://codepen.io/nfj525/pen/rVBaab
//JS Audio Input Visualizer
//https://codepen.io/eddch/pen/ZMOjPL
//Web Audio API
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
//https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
//1. HTML canvas para visualizar
//2. Enumerar canales de entrada/salida
//3. Conectar audio
//4. Dibujar audio conectado en tiempo real

window.onload = function() {
  //

	let file = document.getElementById("file");
  let audio = document.getElementById("audio");
	let canvas = document.getElementById("canvas");

	file.onchange = function() {
    let files = this.files;
    audio.src = URL.createObjectURL(files[0]);
    audio.load();
    audio.play();
	
		let context = new AudioContext();
    let src = context.createMediaElementSource(audio);
    let analyser = context.createAnalyser();

//    canvas.width = window.innerWidth;
//    canvas.height = window.innerHeight;
    let ctx = canvas.getContext("2d");

    src.connect(analyser);
    analyser.connect(context.destination);

    analyser.fftSize = 256;

    let bufferLength = analyser.frequencyBinCount;
    console.log(bufferLength);

    let dataArray = new Uint8Array(bufferLength);

    let WIDTH = canvas.width;
    let HEIGHT = canvas.height;

    let barWidth = (WIDTH / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    function renderFrame() {
      requestAnimationFrame(renderFrame);

      x = 0;

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        
        let r = barHeight + (25 * (i/bufferLength));
        let g = 250 * (i/bufferLength);
        let b = 50;

        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    }

    audio.play();
    renderFrame();
  };
};

console.log("js end");
