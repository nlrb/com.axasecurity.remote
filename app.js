'use strict';

const Homey = require('homey');

class AxaApp extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Axa Remote app has been initialized');
  }
}

module.exports = AxaApp;
