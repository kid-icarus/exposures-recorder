 define(['jquery', 'asyncStorage'],
  function ($, asyncStorage) {
  'use strict';

  window.url = window.URL || window.webkitURL || window.mozURL || window.msURL;

  navigator.getMedia = navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia;

  var Streamer = function () {
    this.video;
    this.cameraStream;
    this.videoElement;

    var self = this;

    var width = 320;
    var height = 180;

    function streamMedia(callback) {
      navigator.getMedia({
        audio: false,
        video: {
          optional: [
            { minHeight: height },
            { maxHeight: height },
            { minWidth: width },
            { maxWidth: width }
          ]
        }
      }, function (stream) {
        if (self.videoElement.mozSrcObject) {
          self.videoElement.mozSrcObject = stream;
        } else {
          self.videoElement.src = window.url.createObjectURL(stream);
        }

        self.videoElement.play();
        callback(null, stream);
      }, function (err) {
        console.log('00')
        callback(err);
      });
    }

    /**
     * Requests permission for using the user's camera,
     * starts reading video from the selected camera.
     */
    function startStreaming(callback) {
      var attempts = 0;
      self.videoElement = document.createElement('video');
      self.videoElement.autoplay = true;
      var streaming = false;

      self.videoElement.addEventListener('canplay', function (ev) {
        if (!streaming) {
          self.videoElement.setAttribute('width', width);
          self.videoElement.setAttribute('height', height);
          streaming = true;
        }
      }, false);

      streamMedia(callback);
    }

    /**
     * Try to initiate video streaming.
     */
    this.startVideo = function (callback) {
      if (navigator.getMedia) {
        startStreaming(function (err, stream) {
          if (err) {
            callback(err);
          } else {

            // Keep references, for stopping the stream later on.
            self.cameraStream = stream;
            self.video = self.videoElement;

            callback(null, {
              stream: self.stream,
              videoElement: self.video
            });
          }
        });
      } else {
        callback(new Error('Could not stream video'));
      }
    };

    this.stopVideo = function () {
      if (this.cameraStream) {
        this.cameraStream.stop();
      }

      if (this.video) {
        this.video.pause();
        this.video.src = null;
        this.video = null;
      }
    };
  };

  return Streamer;
});
