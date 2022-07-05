/*
 * Worker-related tasks
 *
 */

// Dependencies
var path = require('path');
var fs = require('fs');
var _data = require('../data');
var https = require('https');
var http = require('http');
var helpers = require('../helpers');
var url = require('url');
var _logs = require('../logs');
var util = require('util');
var debug = util.debuglog('workers');


// Instantiate the worker module object
var reports_workers = {};

reports_workers.gatherAllReports = function(){

    //list all the reports
    _data.list('reports', function(err, reports){

        if(!err && reports && reports.length>0){

            reports.forEach(function(report){

                _data.read('reports', report, function(error, reportData){

                    if(!error && reportData){
                        
                        _data.read('report_apps', reportData.appReportId, function(error, reportAppData){

                            if(!error && reportAppData){

                                reportData.appReportName = reportAppData.appName;

                                _data.read('cloud_storages', reportAppData.cloudStorageId, function(error, cloudStorageData){

                                    if(!error && cloudStorageData){

                                        reportData.cloudStorageDetails = cloudStorageData;
                                        reports_workers.monitorReportStatus(reportData);
                                        // console.log("reportData", "\n\n", reportData);
                                    }else{
                                        console.log("error while fetching cloud storage data");
                                    };
                                });
                            }else{
                                console.log("error while fetching report app data")
                            };
                        });
                    }else{
                        console.log("error while fetching report data")
                    };
                });
            });
        }else{
            console.log("error while fetching reports list")
        };
    });
};


reports_workers.monitorReportStatus = function(reportData){

    fs.exists(reportData.reportConfiguration.monitorPaths.start, function(isExist){
        
        if(isExist){
            
            fs.exists(reportData.reportConfiguration.monitorPaths.stop, function(isExist){
                
                if(!isExist){

                    fs.stat(reportData.reportConfiguration.monitorPaths.start, function(error, stats){

                        if(stats.ctimeMs > reportData.lastUploadedTime){
                            
                            let awsDetails = {
                                accessKeyId: reportData.cloudStorageDetails.accessKeyId,
                                secretAccessKey: reportData.cloudStorageDetails.secretAccessKey,
                                region: reportData.cloudStorageDetails.region
                            }

                            let s3params = {
                                Bucket: reportData.cloudStorageDetails.bucket,
                                Prefix: reportData.cloudStorageDetails.key+"/LiveReport/"+reportData.appReportName+"/"+reportData.reportName+"/live"
                            }

                            helpers.deleteS3Dir(awsDetails, s3params)
                        }
                        reports_workers.monitorReports(reportData);
                    })

                }else{

                    debug("Report is completed");
                };
            });

        }else{

            debug("Report is not started yet");
        };
    });
};


reports_workers.monitorReports = function(reportData){
    
    let reportsPath = reportData.reportConfiguration.reportsPath;
    let cloudStorageData = reportData.cloudStorageDetails;
    let reportAppName = reportData.appReportName;

    let dirPath = {"path":reportsPath, "ext": true};

    _data.list(dirPath,function(status, fileNames){

        if(!status){

            fileNames.forEach((fileName)=>{

                if(fileName.endsWith(".json")){

                    fs.stat(reportsPath+"/"+fileName, function(error, stats){

                        if(stats.ctimeMs > reportData.lastUploadedTime){
                            let awsDetails = {
                                "credentials":{
                                    "accessKeyId": cloudStorageData.accessKeyId,
                                    "secretAccessKey": cloudStorageData.secretAccessKey
                                },
                                "region": cloudStorageData.region};
                            
                            let uploadParams = {
                                "Bucket": cloudStorageData.bucket, 
                                "Key": cloudStorageData.key+"/LiveReport/"+reportAppName+"/"+reportData.reportName+"/live/"+fileName, 
                                "Body": ''
                            };
                            console.log("uploadParams.Key :\n", uploadParams.Key);
                            console.log("\n\nstats\n\n", stats)
                            let fileStream = fs.createReadStream(reportsPath+"/"+fileName);
                            fileStream.on('error', function(err) {
                            //   console.log('File Error', err);
                            });

                            uploadParams.Body = fileStream;

                            // console.log("uploadParams", uploadParams)
                            helpers.uploadFileToS3(awsDetails, uploadParams, function(status, data){
                                // console.log("status", status, "data", data)
                            });
                        };
                    });
                };
            });

            reportData.lastUploadedTime = Date.now();

            const reportTData = Object.keys(reportData).reduce((object, key) => {
                if (key !== "cloudStorageDetails" || key !== "appReportName") {
                  object[key] = reportData[key]
                }
                return object
              }, {});

            _data.update("reports", reportTData.reportsId, reportData, function(status){
                // console.log("update report",status);
            });
        };
    });
};


// Timer to execute the worker-process once per minute
reports_workers.loop = function(){
    setInterval(function(){
    reports_workers.gatherAllReports();
    },1000 * 10);
  };


// Init script
reports_workers.init = function(){
    // Send to console, in yellow
  console.log('\x1b[33m%s\x1b[0m','Background workers are running');

  // Execute all the checks immediately
  reports_workers.gatherAllReports();

  // Call the loop so the checks will execute later on
  reports_workers.loop();
};


// Export the module
module.exports = reports_workers;