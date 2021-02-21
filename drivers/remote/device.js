'use strict';

const Homey = require('homey');
const AxaRemote = require('axa-remote-api');

class AxaDevice extends Homey.Device {

	onInit() {
		let settings = this.getSettings();
    if (this.remote === undefined) {
      this.remote = new AxaRemote(settings);
    }
		this.remote.connect()
			.then(() => {
        this.log('Connected to', settings.ip + ':' + settings.port);
        // Clear reconnect interval if active
        if (this.reconnect !== undefined) {
          clearInterval(this.reconnect);
          this.reconnect = undefined;
        }
        // Register capability listeners
    		this.registerCapabilityListener('window_position', (state) => {
          // state can be 'open', 'stop', 'close'
          const map = { up: 'open', idle: 'stop', down: 'close' };
          let cmd = map[state];
          this.log('Sending command', cmd);
    			return this.sendCommand(cmd);
    		});
        this.registerCapabilityListener('locked', (state) => {
          // state true or false
          let cmd = state ? 'close' : 'open';
          this.log('Sending command', cmd);
    			return this.sendCommand(cmd);
    		});
        // Set up polling timer
        let interval = (settings.interval || 10) * 1000;
        this.timer = setInterval(() => {
          this.checkStatus();
        }, interval);
        // All done
        this.setAvailable();
        this.checkStatus();
				this.log('AxaDevice has been initialized')
			})
			.catch(err => {
        this.handleError(err.message);
      })
	}

  onDelete() {
    clearInterval(this.timer);
    if (this.remote !== undefined) {
      this.remote.disconnect();
    }
  }

  sendCommand(cmd) {
    return new Promise(async (resolve, reject) => {
      let result = await this.remote.sendCommand(cmd);
      this.log(result);
      if (result && result.code === 200) {
        // All OK
        resolve(result.message);
      } else {
        let err = result ? result.message : 'Failure';
        reject(new Error(err));
      }
    })
  }

  async checkStatus() {
    this.log('Checking status')
    try {
      let state = await this.remote.sendCommand('STATUS');
      this.log(state);
      if (state && (state.code === 210 || state.code === 211)) {
        this.setCapabilityValue('locked', state.code === 211); //'Strong Locked'
      }
    } catch(err) {
      this.error(err);
      if (err instanceof Error) {
        // Serious error
        this.handleError(err.message);
      }
    }
  }

  handleError(message) {
    this.error(message);
    // Only set up a reconnect if none is running
    if (this.reconnect === undefined) {
      this.onDelete();
      this.setUnavailable(message);
      // Retry initialization on interval basis
      this.reconnect = setInterval(() => {
        this.onInit();
      }, 30000);

    }
  }

}

module.exports = AxaDevice;
