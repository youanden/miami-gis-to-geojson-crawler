var http = require('http');
var fs = require('fs');
var sleep = require('sleep');

var gisDocumentApiBaseUrl = "http://gisweb.miamidade.gov/GISSelfServices/DataFunctions/GetDocumentList.aspx?FCID=";
var gisZipBaseUrl = "http://gisweb.miamidade.gov/GISSelfServices/";
var downloadsDir = './gis_zips/';
var currentId = 1;
var maxId = 4000;

var queryNextZip = function() {
  if(currentId < maxId) {
    currentId++;
    sleep.usleep(100000); // 100 ms
    getDocumentList(currentId, onDocumentListReceived);
  }
};
var downloadZip = function(path) {
  http.get(gisZipBaseUrl + path.replace("../",""), function(response) {
    var filePath = downloadsDir + path.split("/")[3];
    var file = fs.createWriteStream(filePath);
    console.log("Downloading " + filePath);
    response.pipe(file);
    response.on('end', function() {
      queryNextZip();
    })
  })
};

var getDocumentList = function(documentId, callback) {
  http.get(gisDocumentApiBaseUrl+documentId, function(response) {
    var body = '';
    response.on('data', function(chunk) {
      body += chunk;
    });
    response.on('end', function() {
      callback(body);
    })
  });
};
var onDocumentListReceived = function(body) {
  console.log("Current ID: " + currentId);
  var regex = /(\.\.\/DATA\/ZIP\/\w+\.ZIP)/;
  var result = body.match(regex);
  if(result && result.length == 2) {
    downloadZip(result[0]);
  } else {
    queryNextZip();
  }
};

getDocumentList(currentId, onDocumentListReceived);

// var file = fs.createWriteStream("file.jpg");
