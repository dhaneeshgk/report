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
var handlers = {
  // users: users_handler.users,
  // _users: users_handler._users,
  // tokens: users_tokens.tokens,
  // _tokens: users_tokens._tokens,
  // report_apps: report_apps.report_apps,
  // _report_apps: report_apps._report_apps,
  // reports:reports.reports,
  // _reports:reports._reports,
  // cloud_storages: cloud_storage.cloud_storages,
  // _cloud_storages:cloud_storage._cloud_storages
};

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