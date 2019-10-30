Module.register("MMM-Screendimmer",{
    // Default module config.
    defaults: {
        path_to_backlight: '/sys/class/backlight/rpi_backlight/brightness',
        query_interval: 30000,
        morning: 25,
        day: 120,
        evening: 90,
        night: 18,
        debug: false,
        override: false,
        overrideValue: 120,
    },

   start: function() {
        self = this;
        Log.info('Starting module: ' + this.name);
        this.sendSocketNotification('MMM-Screendimmer_INIT', this.config);
    },

    notificationReceived: function(notification, payload, sender) {
      	if (sender) {
      		SleepIQControl_Console.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name);
      	} else {
      		console.log(this.name + " received a system notification: " + notification);
      	}
        if (notification === "MMM-Screendimmer_OVERRIDE") {
            this.config.override = true;
            if (payload > 255) payload = 255; //max brightness
            if (payload < 13) payload = 13; //min visible brightness
            this.config.overrideValue = payload;
            this.sendSocketNotification("MMM-Screendimmer_UPDATE_CONFIG", this.config);
            this.sendNotification("MMM-Screendimmer_CURRENT_VALUE", payload);
        }
        if (notification === "MMM-Screendimmer_RESUME") {
            this.config.override = false;
            this.sendSocketNotification("MMM-Screendimmer_UPDATE_CONFIG", this.config);
        }

        if (notification === "MMM-Screendimmer_RESUME") {
            this.config.override = false;
            this.sendSocketNotification("MMM-Screendimmer_UPDATE_CONFIG", this.config);
        }

    },

    socketNotificationReceived: function(notification, payload) {
      if(notification === "MMM-Screendimmer_CURRENT_VALUE") {
        //broadcast to other modules current dimming value
        this.sendNotification(notification, payload);
      }

      if (notification === "MMM-Screendimmer_Console") {
        console.log("Output: ");
        console.log(payload);
      }
    }
});
