/* Magic Mirror
 * Module: MMM-Screendimmer
 */

var SunCalc = require('suncalc');
var fs = require('fs');

var config;
var timer;

module.exports = NodeHelper.create({
  start: function () {
    console.log('MMM-Screendimmer helper started ...');
  },

  query_sun: function() {
    var self = this;
    try {
        if (typeof this.config.latitude === 'undefined') { throw "Missing latitude configuration"; }
        if (typeof this.config.longitude === 'undefined') { throw "Missing longitude configuration"; }
        if (this.config.override) {
            this.writeBacklight(this.config.path_to_backlight,this.config.overrideValue); //overide immediately
            this.sendSocketNotification("MMM-Screendimmer_CURRENT_VALUE", this.config.overrideValue);
            clearInterval(this.timer);
        } else {
          this.setDimmer(this);

          this.timer = setInterval(function(){
              self.setDimmer(self);
          }, this.config.query_interval);
        }
    }
    catch(err) {
        console.log(err);
    }

  },

  setDimmer: function(self) {
    if (!self.config.overide) {
      var local_time = new Date;
      var sunrisePos = SunCalc.getTimes(local_time, self.config.latitude, self.config.longitude);

      if (local_time >= sunrisePos['dawn'] && local_time < sunrisePos['sunriseEnd']) {
          if (self.config.debug === true) { self.debug_log(local_time,'Entering time between dawn and sunriseEd'); }
          self.writeBacklight(self.config.path_to_backlight,self.config.morning);
          self.sendSocketNotification("MMM-Screendimmer_CURRENT_VALUE", self.config.morning);
      }
      if (local_time >= sunrisePos['sunriseEnd'] && local_time < sunrisePos['sunsetStart']) {
          if (self.config.debug === true) { self.debug_log(local_time,'Entering time between sunriseEnd and sunsetStart'); }
          self.writeBacklight(self.config.path_to_backlight,self.config.day);
          self.sendSocketNotification("MMM-Screendimmer_CURRENT_VALUE", self.config.day);
      }
      if (local_time >= sunrisePos['sunsetStart'] && local_time < sunrisePos['dusk']) {
          if (self.config.debug === true) { self.debug_log(local_time, 'Entering time between sunsetStart and dusk'); }
          self.writeBacklight(self.config.path_to_backlight,self.config.evening);
          self.sendSocketNotification("MMM-Screendimmer_CURRENT_VALUE", self.config.evening);
      }
      if (local_time >= sunrisePos['dusk']) {
          var tomorrow = new Date();
          var sunrisePos = SunCalc.getTimes(tomorrow.setDate(tomorrow.getDate() + 1), self.config.latitude, self.config.longitude);
           if (local_time < sunrisePos['dawn']) {
               if (self.config.debug === true) { self.debug_log(local_time,'Entering time between dusk and dawn'); }
               self.writeBacklight(self.config.path_to_backlight,self.config.night);
               self.sendSocketNotification("MMM-Screendimmer_CURRENT_VALUE", self.config.night);
           }
      }
    }
  },

  // Write the values to the backlight
  writeBacklight: function(backlight_file, value) {
      fs.writeFile(backlight_file, value, function(err) {
          if(err) {
              throw(err);
          }
      });
  },

  // Debug function
  debug_log: function(local_time, message) {
      var d = new Date(0);
      console.log(d.setUTCSeconds(local_time / 1000) + ': MMM-Screendimmer: '+message);
  },

  //Subclass socketNotificationReceived received.
  socketNotificationReceived: function(notification, payload) {
      if (notification === 'MMM-Screendimmer_INIT') {
          this.config = payload;
          this.query_sun();
      }
      if (notification === "MMM-Screendimmer_UPDATE_CONFIG") {
          this.config = payload;
          this.query_sun();
  		}
  }

});
