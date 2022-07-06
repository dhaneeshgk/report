/*
 * Request Handler for users
 *
 */

// Dependencies
var _data = require('../data');
var helpers = require('../helpers');
var config = require('../config');
var tokens = require('./tokens')

// Users
var users = function(data,callback){
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
      _users[data.method](data,callback);
    } else {
      callback(405);
    }
  };
  
// Container for all the users methods
var _users  = {};

// Users - post
// Required data: firstName, lastName, userId , emailId, password
// Optional data: none
_users.post = function(data,callback){
// Check that all required fields are filled out
var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
var emailId = typeof(data.payload.emailId) == 'string' && data.payload.emailId.trim().length > 0 ? data.payload.emailId.trim() : false;
var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
var userId = typeof(data.payload.userId) == 'string' && data.payload.userId.trim().length > 0 ? data.payload.userId.trim() : false;

if(firstName && lastName && emailId && password && userId){
    // Make sure the user doesnt already exist
    _data.read('users',userId,function(err,data){
    if(err){
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if(hashedPassword){
        var userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'emailId' : emailId,
            'hashedPassword' : hashedPassword,
            'userId' : userId
        };

        // Store the user
        _data.create('users',userId,userObject,function(err){
            if(!err){
            callback(200);
            } else {
            callback(500,{'Error' : 'Could not create the new user'});
            }
        });
        } else {
        callback(500,{'Error' : 'Could not hash the user\'s password.'});
        }

    } else {
        // User alread exists
        callback(400,{'Error' : 'A user with that userId already exists'});
    }
    });

} else {
    callback(400,{'Error' : 'Missing required fields'});
}

};

// Required data: userId
// Optional data: none
_users.get = function(data,callback){
// Check that userId is valid
var userId = typeof(data.queryStringObject.userId) == 'string' && data.queryStringObject.userId.trim().length == 10 ? data.queryStringObject.userId.trim() : false;
if(userId){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the userId
    tokens._tokens.verifyToken(token, function(tokenIsValid){
    if(tokenIsValid){
        // Lookup the user
        _data.read('users',userId,function(err,data){
        if(!err && data){
            // Remove the hashed password from the user user object before returning it to the requester
            delete data.hashedPassword;
            callback(200,data);
        } else {
            callback(404);
        }
        });
    } else {
        callback(403,{"Error" : "Missing required token in header, or token is invalid."})
    }
    });
} else {
    callback(400,{'Error' : 'Missing required field'})
}
};

// Required data: userId
// Optional data: firstName, lastName, password (at least one must be specified)
_users.put = function(data,callback){
// Check for required field
var userId = typeof(data.payload.userId) == 'string' && data.payload.userId.trim().length == 10 ? data.payload.userId.trim() : false;

// Check for optional fields
var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

// Error if userId is invalid
if(userId){
    // Error if nothing is sent to update
    if(firstName || lastName || password){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that the given token is valid
    tokens._tokens.verifyToken(token, function(tokenIsValid){
        if(tokenIsValid){

        // Lookup the user
        _data.read('users',userId,function(err,userData){
            if(!err && userData){
            // Update the fields if necessary
            if(firstName){
                userData.firstName = firstName;
            }
            if(lastName){
                userData.lastName = lastName;
            }
            if(password){
                userData.hashedPassword = helpers.hash(password);
            }
            // Store the new updates
            _data.update('users',userId,userData,function(err){
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

// Required data: userId

_users.delete = function(data,callback){
// Check that userId is valid
var userId = typeof(data.queryStringObject.userId) == 'string' && data.queryStringObject.userId.trim().length == 10 ? data.queryStringObject.userId.trim() : false;
if(userId){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that the given token is valid
    tokens._tokens.verifyToken(token, function(tokenIsValid){
    if(tokenIsValid){
        // Lookup the user
        _data.read('users',userId,function(err,userData){
        if(!err && userData){
            // Delete the user's data
            _data.delete('users',userId,function(err){
            if(!err){
                callback(200);
                }
            else {
                callback(500,{'Error' : 'Could not delete the specified user'});
            }
            });
        } else {
            callback(400,{'Error' : 'Could not find the specified user.'});
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


// Export the users, _users
module.exports = {users, _users};