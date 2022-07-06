/*
 * Request Handlers
 *
 */

// Dependencies
var _data = require('../data');
var helpers = require('../helpers');
var config = require('../config');
var users_handler = require('./users');
var users_tokens = require('./tokens');
var report_apps = require('./report_apps');
var reports = require('./reports');
var cloud_storage = require('./cloud_storages');

// Define all the handlers
var handlers = {};

/**
 * 
 * UI Handlers
 * 
 */

//Index handler
handlers.livereport = function(data,callback){
  // Reject any request that isn't a GET
  if(data.method == 'get'){
    
    var templateData = {
      'head.title' : 'Live Report',
      'head.description' : 'live-report',
      'body.class' : 'index'
    };

    // Read in a template as a string
    helpers.getTemplate('live-report',templateData,function(err,str){
      if(!err && str){
        // Add the universal header and footer
        helpers.addUniversalTemplates(str,templateData,function(err,str){
          if(!err && str){
            // Return that page as HTML
            callback(200,str,'html');
          } else {
            callback(500,undefined,'html');
          }
        });
      } else {
        callback(500,undefined,'html');
      }
    });
  } else {
    callback(405,undefined,'html');
  }
};


/**
 * 
 *  
 * API Handlers
 */

// Ping
handlers.ping = function(data,callback){
  setTimeout(function(){
    callback(200);
  },5000);

};

// Not-Found
handlers.notFound = function(data,callback){

  callback(404, {"message":"path not found"});
};

handlers.users = users_handler.users;
handlers._users = users_handler._users;

handlers.tokens = users_tokens.tokens;
handlers._tokens = users_tokens._tokens;

handlers.report_apps = report_apps.report_apps;
handlers._report_apps = report_apps._report_apps;

handlers.reports = reports.reports;
handlers._reports = reports._reports;

handlers.cloud_storages = cloud_storage.cloud_storages;
handlers._cloud_storages = cloud_storage._cloud_storages;

// Export the handlers
module.exports = handlers;