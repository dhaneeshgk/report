/*
 * REPORT app primary file for REST API
 *
 */

// Dependencies
var server = require('./lib/server');
var agent_reports_workers = require('./lib/workers/agent_reports_workers');
var cli = require('./lib/cli');

// Declare the app
var app = {};

// Init function
app.init = function(){

  // Start the server
  server.init();

  // Start the reports workers
  agent_reports_workers.init();


  // Start the CLI, but make sure it starts last
  setTimeout(function(){
    cli.init();
  },50);

};

// Self executing
app.init();


// Export the app
module.exports = app;