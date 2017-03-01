// IoT demo client
var http = require("https");

//var inputs = JSON.parse('{ "inputs.poll_inputs_interval": "1000" }');
var inputs = JSON.parse('{ "poll_inputs_interval": "1000" }');
//console.log('JSON.parse - inputs: ' +JSON.stringify(inputs, ' ', '\t'));

//if ((WATER_MARK - SAMPLE_SIZE) < SAMPLE_SIZE) {
//  console.log('SAMPLE_SIZE: ' +SAMPLE_SIZE+ ' is greater than SAMPLE_SIZE minus WATER_MARK');
//}

function poll_inputs (interval) {
  //GET https://raw.githubusercontent.com/npearce/f5_iot_demo/master/iot_client_inputs.json
}

function updateInputs() {

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
//      console.log(body.toString());

      var inputs = JSON.parse(body);
      console.log("JSON.stringify(inputs): " +JSON.stringify(inputs, ' ', '\t'));
    });
  });

  req.end();

  return inputs;
}

console.log("inputs.poll_inputs_interval: " +inputs.poll_inputs_interval);
//updateInputs();
setInterval(updateInputs, inputs.poll_inputs_interval);
// setInterval(getDomains, 1000);
