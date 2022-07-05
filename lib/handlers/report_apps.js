/*
 * Request Handler for users
 *
 */

// Dependencies
var _data = require('../data');
var helpers = require('../helpers');
var config = require('../config');
var tokens = require('./tokens')


// Report Apps
var report_apps = function(data,callback){
    var acceptableMethods = ['post'];//,'get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        _report_apps[data.method](data,callback);
    } else {
      callback(405);
    }
  };
  
// Container for all the report_apps methods
var _report_apps  = {};

// Report Apps - post
// Required data: appName, cloudStorageId
// Optional data: description
_report_apps.post = function(data, callback){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    var appName = typeof(data.payload.appName) == 'string' && data.payload.appName.trim().length > 0 ? data.payload.appName.trim() : false;
    var description = typeof(data.payload.description) == 'string' && data.payload.description.trim().length > 0 ? data.payload.description.trim() : '';
    var cloudStorageId = typeof(data.payload.cloudStorageId) == 'string' && data.payload.cloudStorageId.trim().length > 0 ? data.payload.cloudStorageId.trim() : false;

    tokens._tokens.verifyToken(token, function(status){
      if(status){
        if(appName && cloudStorageId){
    
          // create Id with a random name.
          var reportAppsId = helpers.createRandomString(20);
          var reportAppsObject = {
            'appName' : appName,
            'description' : description,
            'cloudStorageId' : cloudStorageId,
            'Id':reportAppsId
          };
    
          // Store the reportAppsObject
          _data.create('report_apps', reportAppsId, reportAppsObject,function(err){
            if(!err){
              callback(200, reportAppsObject);
            } else {
              callback(500,{'Error' : 'Could not create the new token'});
            }
          });
        } else {
          callback(400,{'Error' : 'Missing required field(s).'})
        }
      }else{
        callback(401);
      };
    });

  };


module.exports = {report_apps, _report_apps};