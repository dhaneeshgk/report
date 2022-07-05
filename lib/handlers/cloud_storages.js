/*
 * Request Handler for cloud storage
 *
 */

// Dependencies
var _data = require('../data');
var helpers = require('../helpers');
var config = require('../config');
var tokens = require('./tokens')

// Cloud Storages
var cloud_storages = function(data,callback){
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        _cloud_storages[data.method](data,callback);
    } else {
      callback(405);
    }
  };
  
// Container for all the cloud storage methods
var _cloud_storages  = {};

// cloud_storages - post
// Required data: name, cloudServiceProvider, accessKeyID, secretKey, region, storageEndpoint
// Optional data: none
_cloud_storages.post = function(data,callback){
// Check that all required fields are filled out
var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
var cloudServiceProvider = typeof(data.payload.cloudServiceProvider) == 'string' && data.payload.cloudServiceProvider.trim().length > 0 ? data.payload.cloudServiceProvider.trim() : false;
var accessKeyId = typeof(data.payload.accessKeyId) == 'string' && data.payload.accessKeyId.trim().length > 0 ? data.payload.accessKeyId.trim() : false;
var secretAccessKey = typeof(data.payload.secretAccessKey) == 'string' && data.payload.secretAccessKey.trim().length > 0 ? data.payload.secretAccessKey.trim() : false;
var region = typeof(data.payload.region) == 'string' && data.payload.region.trim().length > 0 ? data.payload.region.trim() : false;
var storageEndpoint = typeof(data.payload.storageEndpoint) == 'string' && data.payload.storageEndpoint.trim().length > 0 ? data.payload.storageEndpoint.trim() : false;

if(name && cloudServiceProvider && accessKeyId && secretAccessKey && region && storageEndpoint){
    
    // Make sure the cloud_storage doesnt already exist with the same name
    _data.read("cloud_storages", name, function(err,data){
    if(err){

        // Hash the AccessKey and SecretKey
        var hashedAccessKeyId = accessKeyId; //helpers.hash(accessKeyId);
        var hashedSecretAccessKey = secretAccessKey; //helpers.hash(secretKey);
        
        // Id
        var Id = helpers.createRandomString(20);

        // Create the user object
        if(hashedAccessKeyId && hashedSecretAccessKey){
        var cloudStorageObject = {
            'cloudServiceProvider' : cloudServiceProvider,
            'accessKeyId' : hashedAccessKeyId,
            'secretAccessKey' : hashedSecretAccessKey,
            'region' : region,
            'storageEndpoint' : storageEndpoint,
            'Id' : Id,
            'name': name
        };

        // Store the user
        _data.create("cloud_storages", Id, cloudStorageObject,function(err){
            if(!err){
            callback(200, cloudStorageObject);
            } else {
            callback(500,{'Error' : err});
            }
        });
        } else {
        callback(500,{'Error' : 'Could not hash the cloud provider credentials.'});
        }

    } else {
        // cloud_storage alread exists
        callback(400,{'Error' : 'A cloud_storage with that name already exists'});
    }
    });

} else {
    callback(400,{'Error' : 'Missing required fields'});
}

};

// Required data: name of colud_storage
// Optional data: none
_cloud_storages.get = function(data,callback){
// Check that name of colud_storage number is valid
var name = typeof(data.queryStringObject.name) == 'string' && data.queryStringObject.name.trim().length == 10 ? data.queryStringObject.name.trim() : false;
if(name){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid
    handlers._tokens.verifyToken(token, function(tokenIsValid){
    if(tokenIsValid){
        // Lookup the user
        _data.read("cloud_storages", name, function(err,data){
        if(!err && data){
            // Remove the hashed password from the user user object before returning it to the requester
            delete data.hashedPassword;
            callback(200,data);
        } else {
            callback(404);
        }
        });
    } else {
        callback(403, {"Error" : "Missing required token in header, or token is invalid."})
    }
    });
} else {
    callback(400,{'Error' : 'Missing required field'})
}
};

// Required data: name of colud_storage
// Optional data: firstName, lastName, password (at least one must be specified)
_cloud_storages.put = function(data,callback){
// Check for required field
var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length == 10 ? data.payload.name.trim() : false;

// Check for optional fields
var cloudServiceProvider = typeof(data.payload.cloudServiceProvider) == 'string' && data.payload.cloudServiceProvider.trim().length > 0 ? data.payload.cloudServiceProvider.trim() : false;
var accessKeyID = typeof(data.payload.accessKeyID) == 'string' && data.payload.accessKeyID.trim().length > 0 ? data.payload.accessKeyID.trim() : false;
var secretKey = typeof(data.payload.secretKey) == 'string' && data.payload.secretKey.trim().length == 10 ? data.payload.secretKey.trim() : false;
var region = typeof(data.payload.region) == 'string' && data.payload.region.trim().length == 10 ? data.payload.region.trim() : false;

// Error if name is invalid
if(name){
    // Error if nothing is sent to update
    if(cloudServiceProvider || accessKeyID || secretKey || region){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that the given token is valid
    handlers._tokens.verifyToken(token, function(tokenIsValid){
        if(tokenIsValid){

        // Lookup the user
        _data.read("cloud_storages", name, function(err,cloudStorageData){
            if(!err && cloudStorageData){
            // Update the fields if necessary
            if(cloudServiceProvider){
                cloudStorageData.cloudServiceProvider = cloudServiceProvider;
            }
            if(accessKeyID){
                cloudStorageData.accessKeyID = accessKeyID;
            }
            if(secretKey){
                cloudStorageData.secretKey = helpers.hash(secretKey);
            }

            if(region){
                cloudStorageData.region = helpers.hash(region);
            }

            // Store the new updates
            _data.update("cloud_storages", name, cloudStorageData,function(err){
                if(!err){
                callback(200);
                } else {
                callback(500,{'Error' : 'Could not update the user.'});
                }
            });
            } else {
            callback(400,{'Error' : 'Specified user does not exist.'});
            }
        });
        } else {
        callback(403,{"Error" : "Missing required token in header, or token is invalid."});
        }
    });
    } else {
    callback(400,{'Error' : 'Missing fields to update.'});
    }
} else {
    callback(400,{'Error' : 'Missing required field.'});
}

};

// Required data: name of colud_storage
_cloud_storages.delete = function(data,callback){
// Check that name of colud_storage number is valid
var name = typeof(data.queryStringObject.name) == 'string' && data.queryStringObject.name.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
if(name){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that the given token is valid
    handlers._tokens.verifyToken(token, name, function(tokenIsValid){
    if(tokenIsValid){
        // Lookup the user
        _data.read("cloud_storages",name,function(err,userData){
        if(!err && userData){
            // Delete the user's data
            _data.delete("cloud_storages",name,function(err){
            if(!err){
                callback(200);
            } else {
                callback(500,{'Error' : 'Could not delete the specified cloud_storage'});
            }
            });
        } else {
            callback(400,{'Error' : 'Could not find the specified cloud_storage.'});
        }
        });
    } else {
        callback(403,{"Error" : "Missing required token in header, or token is invalid."});
    }
    });
} else {
    callback(400,{'Error' : 'Missing required field'})
}
};

module.exports = {cloud_storages, _cloud_storages}