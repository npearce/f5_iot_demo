//TODO: implement backoff threshold once processed all the records.... if (records < poll_records_batch_size) ..
//TODO: add command line arg for server address

// IoT demo client
var http = require("https");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; //ignore self-signed cert

var recordsCount = 1;
var noInputs = 0;
var fromLastUpdateMicros = 0;
var records = [];
var DEBUG = false;
var inputs = { "poll_inputs_interval": "1000" };  //setting a poll interval for first run

function updateInputs() {  //Retreives operational settings from git repo

  if ((inputs.alive === "false") || (noInputs > "5")) {
    console.log("Kill triggered. Exiting...");
    process.exit();
  }
  else {
    console.log("Polling inputs...");

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

    if (!inputs.domain_batch_size) {
      if (DEBUG == true) { console.log("Awaiting inputs. No Inputs count: " +noInputs) };
      noInputs++;
      setTimeout(updateInputs, 5000);  // Retry iot_client_inputs.json in 5 seconds.
    }
    else {
      setTimeout(updateInputs, inputs.poll_inputs_interval);
    }
  }
}

function processRecords() {   //Collect 'inputs.domain_batch_size' of records until complete.
  if (inputs.domain_batch_size) {  //If we've acquired the environment settings....
    if (DEBUG == true) {
      console.log("Collecting " +inputs.domain_batch_size+ " records.");
      console.log("fromLastUpdateMicros: " +fromLastUpdateMicros);
    }

    var options = {
      "method": "GET",
      "hostname": "192.168.202.162",
      "port": 443,
      "path": "/mgmt/demo/domains-journal?$filter=lastUpdateMicros%20gt%20%27"+fromLastUpdateMicros+"%27&$select=op,ipAddress,domainName,lastUpdateMicros&$top="+inputs.domain_batch_size+"&$orderby=lastUpdateMicros",
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
        jBody = JSON.parse(body);

        console.log("jBody.items.length: " +jBody.items.length);

        if (jBody.items.length == "0") {
          console.log("Records parsed. Posting to Dashboard.");
          postDashboard('127.0.0.1');

          console.log("Backing off for: " +inputs.poll_domains_backoff_interval);
          setTimeout(processRecords, inputs.poll_domains_backoff_interval);
          //implement backoff.

        }
        else {
          if (DEBUG == true) { console.log("DEBUG: Response - jBody " +JSON.stringify(jBody, ' ', '\t')) }; // the entire resposne.
          if (DEBUG == true) { console.log("DEBUG: lastUpdateMicros of item "+inputs.domain_batch_size+" : " +jBody.items[(jBody.items.length -1)].lastUpdateMicros) };

//          console.log("lastUpdateMicros of item "+inputs.domain_batch_size+" : " +jBody.items[(jBody.items.length - 1)].lastUpdateMicros);

          fromLastUpdateMicros = jBody.items[(jBody.items.length - 1)].lastUpdateMicros;  //Grab the lastUpdateMicros of the last entry.

          for (var i in jBody.items)  {
            if (DEBUG == true) { console.log("DEBUG: jBody.items[i].domainName: " +jBody.items[i].domainName+ " .ipAddress " +jBody.items[i].ipAddress) };
            var record = jBody.items[i].domainName+" "+jBody.items[i].ipAddress;
            records.push(record);
          }
          console.log("Up to: " +jBody.items[(jBody.items.length - 1)].ipAddress);
        }

        if (jBody.items.length < inputs.domain_batch_size) { console.log("jBody.items.length < inputs.domain_batch_size:" +jBody.items.length+ " < " +inputs.domain_batch_size); }
        if (DEBUG == true) { console.log("DEBUG: all the records: " +JSON.stringify(records, ' ', '\t')) };  //dump all the records
      });
    });

    req.end();

  }

  setTimeout(processRecords, inputs.poll_domains_interval);
}

function postDashboard(update) {   //POST to the dashboard wWen you are all caught up.

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
