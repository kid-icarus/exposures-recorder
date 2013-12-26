define(['jquery', 'asyncStorage'],
  function ($, asyncStorage) {
  'use strict';

  var Recorder = function () {
    // This is where we change the time lapse count
    var interval = 5.0; // In seconds
    var canvas = document.createElement('canvas');
    var previews = $('.previews');
    var text = $('.text');

    this.video;
    this.hasGeo = false;
    this.videoFrames = {
      media: []
    };
    this.lat = 0;
    this.lon = 0;
    this.streamer;

    var self = this;

    var saveFrame = function (img, callback) {
      self.videoFrames.media.push({
        frame: img.src,
        geo: self.lat + ',' + self.lon,
        description: '',
        created: Math.round(new Date().getTime() / 1000)
      });

      previews.append(img);

      callback();
    };

    var captureFrame = function (pendingFrames, callback) {
      pendingFrames --;
      var currFrame = (pendingFrames - 1) + pendingFrames;
      var img = document.createElement('img');

      canvas.getContext('2d').drawImage(self.video, 0, 0, canvas.width, canvas.height);
      img.src = canvas.toDataURL('image/jpeg', 0.4);

      if (pendingFrames > 0) {
        setTimeout(function () {
          if (self.hasGeo) {
            navigator.geolocation.getCurrentPosition(function (pos) {
              self.lat = pos.coords.latitude;
              self.lon = pos.coords.longitude;
              saveFrame(img, function () {
                captureFrame(pendingFrames, callback);
              });
            });
          } else {
            saveFrame(img, function () {
              captureFrame(pendingFrames, callback);
            });
          }
        }, interval * 1000); // timeouts are in milliseconds
      } else {
        var created = Date.now();
        asyncStorage.getItem('frameList', function (frames) {
          if (frames) {
            frames.unshift(created);
            asyncStorage.setItem('frameList', frames);
          } else {
            asyncStorage.setItem('frameList', [created]);
          }
        });

        self.videoFrames.id = created;
        asyncStorage.setItem('frames[' + self.videoFrames.id + ']', self.videoFrames);
        text.text('Record');
        callback(true);
      }
    };

    this.getScreenshot = function (callback) {
      var pendingFrames = 49;

      if (navigator.geolocation) {
        this.hasGeo = true;
      };

      if (this.video) {
        canvas.width = this.video.width;
        canvas.height = this.video.height;
        text.text('Recording...');
        captureFrame(pendingFrames, callback);
      }
    };
  };

  return Recorder;
});
