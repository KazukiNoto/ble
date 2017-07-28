(function() {
  'use strict';

	let custom1 = '686a9a3b-4c2c-4231-b871-9cfe92cc6b1e';
	let custom2 = '078ff5d6-3c93-47f5-a30c-05563b8d831e';
	let custom3 = 'b962bdd1-5a77-4797-93a1-ede8d0ff74bd';
	var custom = custom1;
	
	let SERVICE = '47fe55d8-447f-43ef-9ad9-fe6325e17c47';
	
  class SNM {
    constructor() {
      this.device = null;
      this.server = null;
      this._characteristics = new Map();
    }
    connect() {
//      return navigator.bluetooth.requestDevice({filters:[{services:[ service ]}]})
      return navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices:[ SERVICE ]})
//      return navigator.bluetooth.requestDevice({ acceptAllDevices: true })
      .then(device => {
        this.device = device;
        return device.gatt.connect();
      })
      .then(server => {
        this.server = server; // BluetoothRemoteGATTServer
        return Promise.all([
          server.getPrimaryService(SERVICE).then(service => {
            return Promise.all([
              this._cacheCharacteristic(service, custom1),
              this._cacheCharacteristic(service, custom2),
              this._cacheCharacteristic(service, custom3)
            ])
          })
        ]);
      })
    }

    startNotifications() {
      return this._startNotifications(custom);
    }
    stopNotifications() {
      return this._stopNotifications(custom);
    }
	read() {
      return this._readCharacteristicValue(custom);
	}
	write(val) {
      return this._writeCharacteristicValue(custom3, val);
	}
    parseHeartRate(value) {
		var code = value.getUint8(0); // 129 == #81
		if (code == 0x81) {
			var len = value.getUint8(1);
			var status = value.getUint8(2); // 0: 更新完了, 1:更新中, 2:更新不可
			return { code, len, status };
		}
		if (code == 0xe0) {
			var len = value.getUint8(1); // 20
			var err = value.getUint8(3); // status error (bit
			var rssi = value.getUint8(6); // RSSI
			var battery = value.getUint16(7, true); // little endian (mV)
			var ack = value.getUint8(10);
			return { err: err, rssi: rssi, battery: battery, ack: ack };
		}
		return { code: code }; //value;
    }

    /* Utils */

    _cacheCharacteristic(service, characteristicUuid) {
      return service.getCharacteristic(characteristicUuid)
      .then(characteristic => {
        this._characteristics.set(characteristicUuid, characteristic);
      });
    }
    _readCharacteristicValue(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      return characteristic.readValue()
      .then(value => {
        return value;
      });
    }
    _writeCharacteristicValue(characteristicUuid, value) {
      let characteristic = this._characteristics.get(characteristicUuid);
      return characteristic.writeValue(value);
    }
    _startNotifications(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      // Returns characteristic to set up characteristicvaluechanged event
      // handlers in the resolved promise.
      return characteristic.startNotifications()
      .then(() => characteristic);
    }
    _stopNotifications(characteristicUuid) {
      let characteristic = this._characteristics.get(characteristicUuid);
      // Returns characteristic to remove characteristicvaluechanged event
      // handlers in the resolved promise.
      return characteristic.stopNotifications()
      .then(() => characteristic);
    }
  }

  window.snm = new SNM();

})();
