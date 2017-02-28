// IoT demo client
var http = require("https");


var WATER_MARK = 0;  // timestampe of where we are up to
var SAMPLE_SIZE = 200;
var POLL_INPUTS_INTERVAL = 10;  //Seconds between retrieving client settings from github.
var POLL_DOMAINS_INTERVAL = 20;   //Seconds between polling /domains for updates.

if ((WATER_MARK - SAMPLE_SIZE) < SAMPLE_SIZE) {
  console.log('SAMPLE_SIZE: ' +SAMPLE_SIZE+ ' is greater than SAMPLE_SIZE minus WATER_MARK');
}


function poll_inputs (interval) {
  //GET https://raw.githubusercontent.com/npearce/f5_iot_demo/master/iot_client_inputs.json


}

function updateInputs() {
  console.log("updateInputs: " +updateInputs);

  var options = {
    "method": "GET",
    "hostname": "raw.githubusercontent.com",
    "port": null,
    "path": "/npearce/f5_iot_demo/master/iot_client_inputs.json",
    "headers": {
      "cache-control": "no-cache"
    }
  };

  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      console.log(body.toString());
    });
  });

  req.end();

  inputs = JSON.stringify(body);

  WATER_MARK = inputs.water_mark;
  SAMPLE_SIZE = body.sample_size;
  POLL_INPUTS = body.poll_inputs;

  console.log("body.water_mark:" +body.water_mark+ " body.sample_size: " +body.sample_size+ " body.poll_inputs: " +body.poll_inputs);


}
updateInputs();
setInterval(updateInputs, 1000);


function getDomains() {
  // implement this...
}
