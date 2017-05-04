//TODO: dump to /etc/hosts
//TODO: add command line arg for server address

// IoT demo client
var http = require("https");
var fs = require("fs");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //ignore self-signed cert

var recordsCount = 1;
var noInputs = 0;
var fromLastUpdateMicros = 0;
var records = [];
var processRecordsTimeout;
var updateInputsTimeout;
var DEBUG = false;
var inputs = { "poll_inputs_interval": "1000" };  //setting a poll interval for first run
var iotServer = process.argv[2];
var maxUpdates = 20;
var dashUpdates = 0;

function updateInputs() {  //Retreives operational settings from git repo

  if ((inputs.alive === "false") || (noInputs > "5")) {
    console.log("Kill triggered. Exiting...");
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
        if (DEBUG == true) { console.log("DEBUG: inputs: " +JSON.stringify(inputs, ' ', '\t')) };
      });
    });

    req.end();

    if (!inputs.domain_batch_size) {   //Not yet reached the Inputs file.
      noInputs++;
      updateInputsTimeout = setTimeout( function () {
        updateInputs();
      }, 2000);  // Retry iot_client_inputs.json in 2 seconds.
    }
    else {
      updateInputsTimeout = setTimeout( function () {
        console.log("Checking for run time updates in "+inputs.poll_inputs_interval+" milliseconds....");
        updateInputs();
      }, inputs.poll_inputs_interval);  // Retry iot_client_inputs.json in 2 seconds.
    }
  }
}

function processRecords() {

  clearTimeout(processRecordsTimeout);
  processRecordsTimeout = setTimeout( function() {
    if (DEBUG == true) { console.log("Retrying in " +inputs.poll_domains_interval+ " milliseconds"); }
    processRecords();
  }, inputs.poll_domains_interval);

  if (inputs.domain_batch_size) {  //If we've acquired the environment settings....
    if (DEBUG == true) {
      console.log("Collecting " +inputs.domain_batch_size+ " records.");
      console.log("fromLastUpdateMicros: " +fromLastUpdateMicros);
    }

    var options = {
      "method": "GET",
      "hostname": iotServer,
      "port": 443,
      "path": "/mgmt/demo/domains-journal?$filter=lastUpdateMicros%20gt%20%27"+fromLastUpdateMicros+"%27&$select=op,ipAddress,domainName,lastUpdateMicros&$top="+inputs.domain_batch_size+"&$orderby=lastUpdateMicros",
      "headers": {
        "authorization": "Basic YWRtaW46YWRtaW4=",
        "cache-control": "no-cache",
        "connection": "keep-alive"
      }
    };

    var req = http.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
        jBody = JSON.parse(body);

        if (DEBUG == true) { console.log("jBody.items.length: " +jBody.items.length); }

        if (jBody.items.length == "0") {
          console.log(records.length+ " records parsed.");
          postDashboard();
          fromLastUpdateMicros = "0"; //reset
          writeHosts(records); //write the processed records to the /etc/hosts file

          clearTimeout(processRecordsTimeout);
          processRecordsTimeout = setTimeout( function() {
            console.log("Polling backoff period entered for " +inputs.poll_domains_backoff_interval+ " milliseconds");
            processRecords();
          }, inputs.poll_domains_backoff_interval);
          records = [];

        }
        else {
          if (DEBUG == true) {
            console.log("DEBUG: Response - jBody " +JSON.stringify(jBody, ' ', '\t')); // the entire resposne.
            console.log("DEBUG: lastUpdateMicros of item "+inputs.domain_batch_size+" : " +jBody.items[(jBody.items.length -1)].lastUpdateMicros);
          }

          fromLastUpdateMicros = jBody.items[(jBody.items.length - 1)].lastUpdateMicros;  //Grab the lastUpdateMicros of the last entry.

          for (var i in jBody.items)  {
            if (DEBUG == true) { console.log("DEBUG: jBody.items[i].domainName: " +jBody.items[i].domainName+ " .ipAddress " +jBody.items[i].ipAddress) };
            var record = jBody.items[i].domainName+" "+jBody.items[i].ipAddress;
            records.push(record);
          }
          if (DEBUG == true) { console.log("Up to: " +jBody.items[(jBody.items.length - 1)].ipAddress); }
        }
        if (DEBUG == true) { console.log("DEBUG: all the records: " +JSON.stringify(records, ' ', '\t')) };  //dump all the records
      });
    });
    req.end();
  }
}

function postDashboard() {   //POST to the dashboard wWen you are all caught up.

  var ifs = require('os').networkInterfaces();
  var clientIp = Object.keys(ifs)
    .map(x => ifs[x].filter(x => x.family === 'IPv4' && !x.internal)[0])
    .filter(x => x)[0].address;

  console.log("Posting IoT client IP " +clientIp+ " to IoT Server Dashboard at: " +iotServer );

  var options = {
    "method": "POST",
    "hostname": iotServer,
    "port": 443,
    "path": "/mgmt/demo/dashboard/",
    "headers": {
      "content-type": "application/json",
      "authorization": "Basic YWRtaW46YWRtaW4=",
      "cache-control": "no-cache",
      "connection": "keep-alive"
    }
  };

  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
//      console.log('postUpdate: ' +body.toString());
    });
  });

  req.write(JSON.stringify({ device: clientIp }));
  req.end();

  if (dashUpdates < maxUpdates) {
    dashUpdates++
  }
  else {
    process.exit();
  }

}

function writeHosts(hosts) { //write the processed records to the /etc/hosts file
  console.log("Updating client /etc/hosts file with " +hosts.length+ " records");
  fs.writeFileSync('/etc/hosts', hosts.join('\n'));
}

updateInputs();
processRecords();
