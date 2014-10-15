/*
 * Some helper shell scripts if you find you've screwed up
 * Will move all geojson files back into root.
 * find ./geo_json -type f -name '*.geojson' -exec mv -i {} ./geo_json \;
 *
 */

var _ = require('lodash-node')
    , xpath = require('xpath')
    , dom = require('xmldom').DOMParser
    , glob = require('glob')
    , fs = require('fs')
    , request = require('request');

var base_folder = "./geo_json/";
// GET LATEST XML STRUCTURE
var raw_xml = request("http://gisweb.miamidade.gov/GISSelfServices/DataFunctions/CreateXMLFC_DSDE_MDC.aspx", onXmlReceived);
var xml;

function cleanName(obj) {
  // In the future if we want to make this lowercase
  // or snake_case, we can use this.
  return obj.toString().replace(/(&amp;)/g, 'AND');
}

function onXmlReceived(err, res, body) {
  xml = new dom().parseFromString(body);
  getGeoJsonFiles();
}

function getGeoJsonFiles() {
  glob("geo_json/*.geojson", {}, onFilesEnumerated);
}

function createFolder(path) {
  try {
    fs.mkdirSync(base_folder + path);
  } catch( e ) {
    if ( e.code != 'EEXIST' ) {
      throw e;
      return false;
    }
  }
  return true;
}

function createCategoryFolder(category) {
  return createFolder(category);
}

function createSubCategoryFolder(top_category, category) {
  return createFolder(top_category + "/" + category);
}

function moveFile(file, top_category, category) {
  var file_name = file.split("/")[1]; // with ext
  try {
    fs.renameSync(
      file,
      base_folder + top_category + "/" + category + "/" + file_name
    );
  } catch( e ) {
    if ( e.code != 'EEXIST' ) {
      throw e;
      return false;
    }
  }
  return true;
}

// LOOP THROUGH EACH GEOJSON FILE
function onFilesEnumerated(err, files) {
  // USE FILE NAME SANS EXTENSION TO FIND NODE WITH VALUE
  _(files).forEach(function(file) {
    try {
      var file_name = file.split("/")[1].split(".")[0]; // without ext
      if(!file_name) throw "File name not formatted correctly."
      console.log("File:", file_name);
      var nodes = xpath.select('//name[.="' + file_name + '"]', xml);
      if(nodes.length !== 1) throw "Wrong amount of nodes found. Match should be singular."
      // GET NODE strategicArea
      var parent = nodes[0].parentNode;
      var top_category = cleanName(xpath.select('strategicArea/text()', parent));
      // CREATE FOLDER IF NOT EXISTS
      if( ! createCategoryFolder(top_category)) throw "Couldn't create folder or some other similar issue."
      var category = cleanName(xpath.select('name/text()', parent.parentNode));
      // CREATE FOLDER IN strategicArea FOLDER IF NOT EXISTS
      if( ! createSubCategoryFolder(top_category, category)) throw "Couldn't create folder or some other similar issue."
      // MOVE GEOJSON FILE TO SAID DIRECTORY
      if( ! moveFile(file, top_category, category)) throw "Unable to move the file for some reason."
    } catch( e ) {
      console.log("Failed:", e);
    }
  });
}


// STOP SHOUTING!
