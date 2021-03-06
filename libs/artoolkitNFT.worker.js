console.log("loaded artoolkitNFT...");

importScripts('artoolkitNFT_wasm.js');

console.log("after calling importScripts with artoolkitNFT...");

self.onmessage = function (e) {
  var msg = e.data;
  switch (msg.type) {
    case 'load': {
      load(msg);
      return;
    }
    case 'process': {
      next = msg.imagedata;
      process();
      return;
    }
  }
};

var next = null;
var ar = null;
var markerResult = null;

function load (msg) {

  self.addEventListener('artoolkitNFT-loaded', function () {
    console.log('Loading marker at: ', msg.marker);

    var onLoad = function () {
      ar = new ARControllerNFT(msg.pw, msg.ph, param);
      var cameraMatrix = ar.getCameraMatrix();

      ar.addEventListener('getNFTMarker', function (ev) {
        markerResult = {type: "found", matrixGL_RH: JSON.stringify(ev.data.matrixGL_RH), proj: JSON.stringify(cameraMatrix)};
      });

      ar.loadNFTMarker(msg.marker, function (nft) {
        ar.trackNFTMarkerId(nft.id);
        console.log("loadNFTMarker -> ", nft.id);
        console.log("nftMarker struct: ", nft);
        postMessage({ type: 'endLoading', end: true }),
          function (err) {
          console.error('Error in loading marker on Worker', err);
        };
      });

      postMessage({ type: 'loaded', proj: JSON.stringify(cameraMatrix) });
    };

    var onError = function (error) {
      console.error(error);
    };

    // ! Fix pathing for camera_para.dat; it's relative to where artoolkitNFT_wasm.js resides
    // TODO Fix pathing for camera_para.dat; it's relative to where artoolkitNFT_wasm.js resides
    // TODO See cameraParamUrl code in ARnft > Worker.js for reference

    console.log('Loading camera at:', msg.camera_para);

    // we cannot pass the entire ARControllerNFT, so we re-create one inside the Worker, starting from camera_param
    var param = new ARCameraParamNFT(msg.camera_para, onLoad, onError);
  });

}

function process () {

  markerResult = null;

  if (ar && ar.process) {
    ar.process(next);
  }

  if (markerResult) {
    postMessage(markerResult);
  } else {
    postMessage({type: 'not found'});
  }

  next = null;
}
