// IoT demo client
var http = require("https");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //ignore self-signed cert

var inputsCount = 1;
var recordsCount = 1;

var inputs = JSON.parse('{ "poll_inputs_interval": "1000" }');  //setting a poll interval for first run

//if ((WATER_MARK - SAMPLE_SIZE) < SAMPLE_SIZE) {
//  console.log('SAMPLE_SIZE: ' +SAMPLE_SIZE+ ' is greater than SAMPLE_SIZE minus WATER_MARK');
//}

function updateInputs() {  //Retreives operational settings from git repo

  if (inputs.alive === false) {
    process.exit();
  }
  else {
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

    console.log("count: " +inputsCount);
    inputsCount++;

  //  console.log("inputs.poll_inputs_interval: " +inputs.poll_inputs_interval);
    setTimeout(updateInputs, inputs.poll_inputs_interval);
  }
}

function processRecords() {   //Get the last 'inputs.domain_batch_size' records since 'lastUpdateMicros'
  if (!inputs.domain_batch_size) {
    console.log("getDomains() NO domain_batch_size: " +inputs.domain_batch_size);
  }
  else {
    console.log("getDomains() domain_batch_size: " +inputs.domain_batch_size);

    var options = {
      "method": "GET",
      "hostname": "192.168.202.162",
      "port": 443,
      "path": "/mgmt/demo/domains-journal?$filter=lastUpdateMicros%20gt%20%271487377200000000%27&$select=op,ipAddress,domainName,lastUpdateMicros&$top=" +inputs.domain_batch_size+ "&$orderby=lastUpdateMicros",
      "headers": {
        "authorization": "Basic YWRtaW46YWRtaW4=",
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
        console.log("You caught a fish this big: " +body.toString().length);
//        console.log("getDomains() inputs: " +body.toString());
      });
    });

    req.end();

    console.log("processRecords count: " +recordsCount);
    recordsCount++;
  }
  setTimeout(processRecords, inputs.poll_domains_interval);
}
function postUpdate(update) {   //POST to the dashboard wWen you are all caught up.
  //POST to Dashboard!
  //POST https://10.145.200.47/mgmt/demo/dashboard { “device” : “10.10.10.10” }
  var http = require("https");

  var options = {
    "method": "POST",
    "hostname": "192.168.202.162",
    "port": 443,
    "path": "/mgmt/demo/dashboard/",
    "headers": {
      "content-type": "application/json",
      "authorization": "Basic YWRtaW46YWRtaW4=",
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
      console.log('postUpdate: ' +body.toString());
    });
  });

  req.write(JSON.stringify({ device: update }));
  req.end();


}

updateInputs();
processRecords();
