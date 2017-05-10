// IoT demo client
var http = require("https");
var fs = require("fs");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //ignore self-signed cert
http.globalAgent.keepAlive = true; //enable session keep-alive

var recordsCount = 1;
var noInputs = 0;
var fromLastUpdateMicros = 0;
var records = [];
var processRecordsTimeout;
var updateInputsTimeout;
var DEBUG = true;
var inputs = { "poll_inputs_interval": "30000",
"poll_domains_interval": "500",
"poll_domains_jitter": "10",
"poll_domains_backoff_interval": "10000",
"domain_batch_size": "200",
"alive": "true" };  //setting a poll interval for first run
var iotServer = process.argv[2];
var maxUpdates = 20;
var dashUpdates = 0;
var pollCount = 1;

function processRecords() {

  clearTimeout(processRecordsTimeout);
  processRecordsTimeout = setTimeout( function() {
    if (DEBUG == true) { console.log("Polling in" +inputs.poll_domains_interval+ " milliseconds"); }
    processRecords();
  }, inputs.poll_domains_interval);

  if (DEBUG == true) {
    console.log("Collecting " +inputs.domain_batch_size+ " records.");
    console.log("fromLastUpdateMicros: " +fromLastUpdateMicros);
  }

  var options = {
    "method": "GET",
    "hostname": iotServer,
    "port": 443,
//      "path": "/mgmt/demo/domains-journal?$filter=lastUpdateMicros%20gt%20%27"+fromLastUpdateMicros+"%27&$select=op,ipAddress,domainName,lastUpdateMicros&$top="+inputs.domain_batch_size+"&$orderby=lastUpdateMicros",
    "path": "/mgmt/demo/domains-journal?$select=op,ipAddress,domainName,lastUpdateMicros&$top=200",
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

      var mod = maxUpdates % pollCount;
      console.log("maxUpdates: " +maxUpdates);
      console.log("pollCount: " +pollCount);
      console.log("mod: " +mod);

//        if (jBody.items.length == "0") {
      if (mod == "0") {
        console.log("Divide by 5: " +mod);
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
//          console.log("DEBUG: Response - jBody " +JSON.stringify(jBody, ' ', '\t')); // the entire resposne.
          console.log("DEBUG: lastUpdateMicros of item "+inputs.domain_batch_size+" : " +jBody.items[(jBody.items.length -1)].lastUpdateMicros);
        }

        fromLastUpdateMicros = jBody.items[(jBody.items.length - 1)].lastUpdateMicros;  //Grab the lastUpdateMicros of the last entry.

        for (var i in jBody.items)  {
//          if (DEBUG == true) { console.log("DEBUG: jBody.items[i].domainName: " +jBody.items[i].domainName+ " .ipAddress " +jBody.items[i].ipAddress) };
          var record = jBody.items[i].domainName+" "+jBody.items[i].ipAddress;
          records.push(record);
        }
        if (DEBUG == true) { console.log("Up to: " +jBody.items[(jBody.items.length - 1)].ipAddress); }
      }
//      if (DEBUG == true) { console.log("DEBUG: all the records: " +JSON.stringify(records, ' ', '\t')) };  //dump all the records
    });
  });
  req.end();
  pollCount++;
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

processRecords();
