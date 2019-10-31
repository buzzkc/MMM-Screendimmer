/* Magic Mirror
 * Module: MMM-Screendimmer
 */

var SunCalc = require('suncalc');
var fs = require('fs');

module.exports = NodeHelper.create({
  start: function () {
    console.log('MMM-Screendimmer helper started ...');
  },

  query_sun: function(config) {
    var self = this;
    try {
        if (typeof config.latitude === 'undefined') { throw "Missing latitude configuration"; }
        if (typeof config.longitude === 'undefined') { throw "Missing longitude configuration"; }
        if (config.override) {
            this.writeBacklight(config.path_to_backlight,config.overrideValue); //overide immediately
            this.sendSocketNotification("MMM-Screendimmer_CURRENT_VALUE", config.overrideValue);
        } else {
          this.setDimmer(self, config);

          setInterval(function(){
              self.setDimmer(self, config);
          }, config.query_interval);
        }
    }
    catch(err) {
        console.log(err);
    }

  },

  setDimmer: function(self, config) {
    if (!config.overide) {
      var local_time = new Date;
      var sunrisePos = SunCalc.getTimes(local_time, config.latitude, config.longitude);

      if (local_time >= sunrisePos['dawn'] && local_time < sunrisePos['sunriseEnd']) {
          if (config.debug === true) { self.debug_log(local_time,'Entering time between dawn and sunriseEd'); }
          self.writeBacklight(config.path_to_backlight,config.morning);
          self.sendSocketNotification("MMM-Screendimmer_CURRENT_VALUE", config.morning);
      }
      if (local_time >= sunrisePos['sunriseEnd'] && local_time < sunrisePos['sunsetStart']) {
          if (config.debug === true) { self.debug_log(local_time,'Entering time between sunriseEnd and sunsetStart'); }
          self.writeBacklight(config.path_to_backlight,config.day);
          self.sendSocketNotification("MMM-Screendimmer_CURRENT_VALUE", config.day);
      }
      if (local_time >= sunrisePos['sunsetStart'] && local_time < sunrisePos['dusk']) {
          if (config.debug === true) { self.debug_log(local_time, 'Entering time between sunsetStart and dusk'); }
          self.writeBacklight(config.path_to_backlight,config.evening);
          self.sendSocketNotification("MMM-Screendimmer_CURRENT_VALUE", config.evening);
      }
      if (local_time >= sunrisePos['dusk']) {
          var tomorrow = new Date();
          var sunrisePos = SunCalc.getTimes(tomorrow.setDate(tomorrow.getDate() + 1), config.latitude, config.longitude);
           if (local_time < sunrisePos['dawn']) {
               if (config.debug === true) { self.debug_log(local_time,'Entering time between dusk and dawn'); }
               self.writeBacklight(config.path_to_backlight,config.night);
               self.sendSocketNotification("MMM-Screendimmer_CURRENT_VALUE", config.night);
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
          this.query_sun(payload);
      }
      if (notification === "MMM-Screendimmer_UPDATE_CONFIG") {
    			this.query_sun(payload);
  		}
  }

});
