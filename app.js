var canvas = document.querySelector('canvas');
var statusText = document.querySelector('#statusText');

statusText.addEventListener('click', function() {
  statusText.textContent = 'connecting...';
  snm.connect()
  .then(() => snm.startNotifications().then(handle))
  .catch(error => {
	console.log(error);
	statusText.textContent = error;
  });
});

function handle(measurement) {
	var buf = new ArrayBuffer(3);
	var cmd = new DataView(buf);
	cmd.setUint8(0, 1 + 0x80); // event code
	cmd.setUint8(1, 3); // total len
	cmd.setUint8(2, 0x7c); // （Pressure、Humidity/Temperature、UV/Ambient Light
	snm.write(cmd).then(data => {
		cmd.setUint8(0, 0xa0); // event code == start(0x20 + 0x80)
		cmd.setUint8(1, 3); // total len
		cmd.setUint8(2, 0);
		snm.write(cmd).then(data => {
		  snm.read().then(data => {
				console.log(data);
				console.log(data.byteLength + " " + data.byteOffset);
				data = snm.parseHeartRate(data);
				console.log(data);
				statusText.textContent = "status: " + data.err + " RSSI: " + data.rssi + " battery: " + data.battery + "mV ACK: " + data.ack;
			});
		});
	});
}
