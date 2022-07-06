/*
 * Helpers
 *      - To monitor s3 bucket
 *      - To upload files
 *      - To downlaod files
 *      - To update files
 */

// Dependencies
// var config = require('./config');
const fs = require('fs');
var crypto = require('crypto');
var https = require('https');
var aws = require('aws-sdk');
var s3 = require('s3');
var path = require('path');
var querystring = require('querystring');
var config = require('./config');


// Container for all the helpers
var helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
  try{
    var obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = function(str){
  if(typeof(str) == 'string' && str.length > 0){
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    // Define all the possible characters that could go into a string
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    var str = '';
    for(i = 1; i <= strLength; i++) {
        // Get a random charactert from the possibleCharacters string
        var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        // Append this character to the string
        str+=randomCharacter;
    }
    // Return the final string
    return str;
  } else {
    return false;
  }
};

helpers._createS3client = function(awsDetails, callback){

  var client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
      accessKeyId: awsDetails.accessKeyId,
      secretAccessKey: awsDetails.secretAccessKey,
      region: awsDetails.region
    }
  });
  callback(client);
};

helpers.uploadFileToS3 = function(awsDetails, uploadParams, callback){
  
  // configure the aws details
  aws.config.update(awsDetails);

  // create s3 instance
  let s3 = new aws.S3({apiVersion: '2006-03-01'});

  // call S3 to retrieve upload path to specified bucket
  s3.upload(uploadParams, function (err, data) {
    if (err) {
      callback(false, err)
      // console.log("Error", err);
    } if (data) {
      // console.log(true, data.Location);
      callback(true, data.Location)
    }
  });
}


helpers.downloadFileFromS3 = function(awsDetails, downloadParams, local_file_path, callback){

    // configure the aws details
    aws.config.update(awsDetails)

    // create s3 instance
    let s3 = new aws.S3({apiVersion: '2006-03-01'});
  
    // call S3 to download s3 path to specified path
    var filestream = s3.getObject(downloadParams, function(error, data){}).createReadStream();
  
  outstream = fs.createWriteStream(local_file_path+"/"+downloadParams.Key);
  filestream.pipe(outstream);

  callback(200, "Downloaded successfully from s3 to " + local_file_path + "/"+download_params.Key)
}

helpers.deleteS3Dir = function(awsDetails, deleteParams, callback){


      let client = helpers._createS3client(awsDetails, function(client){
        s3params = {
          "Bucket": deleteParams.Bucket,
          "Prefix": deleteParams.Prefix
        }
        // console.log("key", s3params.Prefix);
        var deleter = client.deleteDir(s3params)

        deleter.on('error', function(err) {
          // console.error("error while deleting", err.stack);
          callback(false, err.stack)
        });
  
        deleter.on('end', function(err) {
          callback(true);
          // console.log("successfully deleted directory from s3", err);
        });
      });
};

helpers.downloadS3Dir = function(awsDetails, downloadParams, callback){


  let client = helpers._createS3client(awsDetails, function(client){

    let params = {
      localDir:downloadParams.localDir,
      s3params:{
        "Bucket": downloadParams.Bucket,
        "Prefix": downloadParams.Prefix
      }
    };

    // console.log("key", s3params.Prefix);
    var downlaoder = client.downloadDir(params)

    downlaoder.on('error', function(err) {
      console.error("error while downloading", err.stack);
      callback(false, err.stack)
    });

    downlaoder.on('end', function(err) {
      callback(true);
      console.log("successfully downloaded from directory s3", err);
    });
  });
};

// Get the string content of a template, and use provided data for string interpolation
helpers.getTemplate = function(templateName,data,callback){
  templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
  data = typeof(data) == 'object' && data !== null ? data : {};
  if(templateName){
    var templatesDir = path.join(__dirname,'/../templates/');
    fs.readFile(templatesDir+templateName+'.html', 'utf8', function(err,str){
      if(!err && str && str.length > 0){
        // Do interpolation on the string
        var finalString = helpers.interpolate(str,data);
        callback(false,finalString);
      } else {
        callback('No template could be found');
      }
    });
  } else {
    callback('A valid template name was not specified');
  }
};

// Add the universal header and footer to a string, and pass provided data object to header and footer for interpolation
helpers.addUniversalTemplates = function(str,data,callback){
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data !== null ? data : {};
  // Get the header
  helpers.getTemplate('_header',data,function(err,headerString){
    if(!err && headerString){
      // Get the footer
      helpers.getTemplate('_footer',data,function(err,footerString){
        if(!err && headerString){
          // Add them all together
          var fullString = headerString+str+footerString;
          callback(false,fullString);
        } else {
          callback('Could not find the footer template');
        }
      });
    } else {
      callback('Could not find the header template');
    }
  });
};

// Take a given string and data object, and find/replace all the keys within it
helpers.interpolate = function(str,data){
  str = typeof(str) == 'string' && str.length > 0 ? str : '';
  data = typeof(data) == 'object' && data !== null ? data : {};

  // Add the templateGlobals to the data object, prepending their key name with "global."
  for(var keyName in config.templateGlobals){
     if(config.templateGlobals.hasOwnProperty(keyName)){
       data['global.'+keyName] = config.templateGlobals[keyName]
     }
  }
  // For each key in the data object, insert its value into the string at the corresponding placeholder
  for(var key in data){
     if(data.hasOwnProperty(key) && typeof(data[key] == 'string')){
        var replace = data[key];
        var find = '{'+key+'}';
        str = str.replace(find,replace);
     }
  }
  return str;
};

// Get the contents of a static (public) asset
helpers.getStaticAsset = function(fileName,callback){
  fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false;
  if(fileName){
    var publicDir = path.join(__dirname,'../../public');
    fs.readFile(publicDir+fileName, function(err,data){
      if(!err && data){
        callback(false,data);
      } else {
        // console.log("No file could be found'")
        callback('No file could be found');
      }
    });
  } else {
    callback('A valid file name was not specified');
  }
};



// Export the module
module.exports = helpers;


// aws_sdk.config.update({credentials:{accessKeyId:'AKIAXP5PFOG7UOM4HG5Y',
// secretAccessKey:'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'},region:'us-east-1'});

// // Create S3 service object
// var s3 = new aws_sdk.S3({apiVersion: '2006-03-01'});

// // call S3 to retrieve upload file to specified bucket
// // s3://report-live-p/report/
// var uploadParams = {Bucket: 'report-live-p', Key: '', Body: ''};
// var file = '/Volumes/YOU/YOU/Vidhya/JavaScript/hackathon/philips/report/index.js';

// // Configure the file stream and obtain the upload parameters
// // var fs = require('fs');
// var fileStream = fs.createReadStream(file);
// fileStream.on('error', function(err) {
//   console.log('File Error', err);
// });
// uploadParams.Body = fileStream;
// var path = require('path');
// const { S3 } = require('aws-sdk');
// uploadParams.Key = 'report/'+path.basename(file);

// // call S3 to retrieve upload file to specified bucket
// s3.upload (uploadParams, function (err, data) {
//   if (err) {
//     console.log("Error", err);
//   } if (data) {
//     console.log("Upload Success", data.Location);
//   }
// });

// downloadParams = {};

// downloadParams.Bucket = 'report-live-p'
// downloadParams.Key = 'report/'+path.basename(file);

// var filestream = s3.getObject(downloadParams, function(error, data){
//     // if (error != null) {
//     //     console.log("Failed to retrieve an object: " + error);
//     //   } else {
//     //     console.log("Loaded " + data.ContentLength + " bytes");
//     //   }
// }).createReadStream();

// ostream = fs.createWriteStream("/Volumes/YOU/YOU/Vidhya/JavaScript/hackathon/philips/report/tmp/index2.js");
// filestream.pipe(ostream);


// fs.readdir('/Volumes/YOU/YOU/Vidhya/JavaScript/hackathon/philips/report', (err, files) => {
//     files.forEach(file => {
//       console.log(file);
//     //   console.log('FileName : ', '/Volumes/YOU/YOU/Vidhya/JavaScript/hackathon/philips/report'+file)
//       fs.stat('/Volumes/YOU/YOU/Vidhya/JavaScript/hackathon/philips/report/'+file, (err, stats)=>{
//         // console.log('file-size', stats);
//       });
//     });
//   });