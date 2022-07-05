/*
 * Request Handler for reports 
 *
 */

// Dependencies
var _data = require('../data');
var helpers = require('../helpers');
var config = require('../config');
var tokens = require('./tokens');

// Reports
var reports = function(data,callback){
    var acceptableMethods = ['post']; //,'get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        _reports[data.method](data,callback);
    } else {
      callback(405);
    }
  };


// Container for all the reports methods
var _reports = {};

// Reports - post
// Required data: reportName, appReportName, reportConfiguration
// Optional data: description
_reports.post = function(data, callback){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    var reportName = typeof(data.payload.reportName) == 'string' && data.payload.reportName.trim().length > 0 ? data.payload.reportName.trim() : false;
    var description = typeof(data.payload.description) == 'string' && data.payload.description.trim().length > 0 ? data.payload.description.trim() : '';
    var appReportId = typeof(data.payload.appReportId) == 'string' && data.payload.appReportId.trim().length > 0 ? data.payload.appReportId.trim() : false;
    var reportConfiguration = typeof(data.payload.reportConfiguration) == 'object'? data.payload.reportConfiguration : false;

    // Verify that the given token is valid
    tokens._tokens.verifyToken(token, function(status){

        if(status){
            if(reportName && appReportId && reportConfiguration){

            // create Id with a random name.
            var reportsId = helpers.createRandomString(20);
            var reportObject = {
                'reportsId':reportsId,
                'reportName' : reportName,
                'description' : description,
                'appReportId' : appReportId,
                'reportConfiguration' : reportConfiguration
            };
        
            // Store the reportsObject
            _data.create('reports', reportsId, reportObject,function(err){
                if(!err){
                callback(201, reportObject);
                } else {
                callback(500,{'Error' : 'Could not create the report'});
                }
            });
            } else {
            callback(400,{'Error' : 'Missing required field(s).'})
            }
        }else{
            callback(401);
        }
    });
};


module.exports = {reports, _reports};