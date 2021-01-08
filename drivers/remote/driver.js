'use strict'

const Homey = require('homey');
const AxaRemote = require('axa-remote-api');

class AxaDriver extends Homey.Driver {

	onInit() {
  }

  onPair(socket) {
    this.log('Pairing started')

    socket.emit('authorized')

    socket.on('check', async (data, callback) => {
      this.log('Checking', data)
      try {
        let remote = new AxaRemote(data);
				await remote.connect();
        let result = await remote.checkAxaRemote();

				if (result) {
					let id = data.ip + ':' + data.port;
					let device = {
	          name: 'AXA Remote 2.0',
	          data: { id: id },
	          settings: {
	            ip: data.ip,
							port: Number(data.port),
	            interval: 10
	          }
	        }
					remote.disconnect();
	        callback(null, device)
				} else {
					callback(new Error('Not an AXA Remote 2.0'), null)
				}
      } catch(err) {
        this.error(err.error || err)
        callback(err.error || err, null)
      }
    })
  }

}

module.exports = AxaDriver
