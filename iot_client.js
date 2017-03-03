// IoT demo client
var http = require("https");


var count = 1;
var inputs = JSON.parse('{ "poll_inputs_interval": "1000" }');  //setting a poll interval for first run

//if ((WATER_MARK - SAMPLE_SIZE) < SAMPLE_SIZE) {
//  console.log('SAMPLE_SIZE: ' +SAMPLE_SIZE+ ' is greater than SAMPLE_SIZE minus WATER_MARK');
//}

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
      inputs = JSON.parse(body);
      console.log("inputs: " +JSON.stringify(inputs, ' ', '\t'));
    });
  });

  req.end();

  console.log("count: " +count);
  count++;

  console.log("inputs.poll_inputs_interval: " +inputs.poll_inputs_interval);
  setTimeout(updateInputs, inputs.poll_inputs_interval);
}

function getDomains() {
  if (!inputs.domain_batch_size) {
    console.log("getDomains() NO domain_batch_size: " +inputs.domain_batch_size);
  }
  else {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //ignore self-signed cert
    console.log("getDomains() domain_batch_size: " +inputs.domain_batch_size);

    var options = {
      "method": "GET",
      "hostname": "192.168.202.162",
      "port": 443,
      "path": "mgmt/demo/domains-journal?$filter=lastUpdateMicros%20gt%20%271487377200000000%27&$select=op,ipAddress,domainName,lastUpdateMicros&$top=" +inputs.domain_batch_size+ "&$orderby=lastUpdateMicros",
      "headers": {
        "authorization": "Basic YWRtaW46YWRtaW4=",
        "cache-control": "no-cache"
      }
    };

    console.log("options: " +JSON.stringify(options, ' ', '\t'));

    var req = http.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
        console.log("You caught a fish this big: " +body.toString().length);
        console.log("getDomains() inputs: " +body.toString());
      });
    });

    req.end();

    console.log("count: " +count);
    count++;
  }
  setTimeout(getDomains, inputs.poll_inputs_interval);
}


updateInputs();
getDomains();

//setInterval(updateInputs(input), inputs.poll_inputs_interval);
// setInterval(getDomains, 1000);
