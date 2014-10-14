var sys = require('sys')
var fs = require('fs');
var request = require('request');
var exec = require('child_process').exec;
var sleep = require('sleep');

var shapeEscapeUrl = "http://shpescape.com/mix/";
var gisZipsDir = "./gis_zips";
var geoJsonDir = "./geo_json";
var gisFiles = [];
var currentIndex = 0;
function onGetGisFiles(error, stdout, stderr) {
  getGisFiles(error,stdout,stderr,beginUpload);
}
function getGisFiles(error, stdout, stderr, cb) {
  var lines = stdout.split("\n");
  for (var i = 0; i < lines.length; i++) {
    gisFiles.push(lines[i].split("\t")); // [0]: filesize | [1]: filepath
  }
  cb();
}
function beginUpload() {
  if(currentIndex < gisFiles.length) {
    var currentFilePath = gisFiles[currentIndex][1];
    if(currentFilePath == "gis_zips") {
      currentIndex++;
      return;
    } else {
      var formData = { file_obj: fs.createReadStream("./" + currentFilePath) };
      request.post({url:shapeEscapeUrl, formData: formData}, function optionalCallback(err, httpResponse, body) {
        if (err) { console.error('upload failed:', err); }
        // console.log(httpResponse.headers);
        global.h = httpResponse;
        if(httpResponse.headers.location) {
          var hash = httpResponse.headers.location.split("/")[5];
          var newFilePath = currentFilePath.split("/")[1].split(".")[0] + ".geojson";
          var mediary = request(shapeEscapeUrl + "uploads/" + hash + "/");
          mediary.on('end', function() {
            var r = request(shapeEscapeUrl + "uploads/" + hash + ".json").pipe(fs.createWriteStream("./geo_json/" + newFilePath));
            console.log("Saving File", newFilePath);
            currentIndex++;
            sleep.usleep(100000);
            beginUpload();
          });

        } else {
            console.log("Skipping File");
            currentIndex++;
            sleep.usleep(100000);
            beginUpload();
        }
      });
    }
  }
}

exec('du -ah gis_zips | grep -v "/$" | sort -h', onGetGisFiles);
// Get list of files sorted from smallest to largest
// For each file, upload to shapescape.com and
// ...download the generated file to geojson folder
