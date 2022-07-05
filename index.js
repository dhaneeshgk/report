/*
 * REPORT app primary file for REST API
 *
 */

// Dependencies
var server = require('./lib/server');
var reports_workers = require('./lib/workers/reports_workers');

// Declare the app
var app = {};

// Init function
app.init = function(){

  // Start the server
  server.init();

  // Start the reports workers
  reports_workers.init();
};

// Self executing
app.init();


// Export the app
module.exports = app;