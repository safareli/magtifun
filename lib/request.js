"use strict";
var http = require('http'),
    LocalStorage = require('node-localstorage').LocalStorage,
    localStorage = new LocalStorage(".magtifun"),
    queryString = require('querystring'),
    Q = require('q');
    
module.exports.post = function(path,data){
    var deferred = Q.defer();
    var body='';
    var postdata = queryString.stringify(data);
    var options = {
        host: 'www.magtifun.ge',
        port: '80',
        path: path,
        method: 'POST',
        headers:{
            'Content-Type':'application/x-www-form-urlencoded',
            'Content-Length':postdata.length,
            'Cookie':localStorage.getItem('cookie')
        }
    };
    var request = http.request(options, function(response) {
        response.on('data', function (chunk) {
            body += chunk;
        });
        response.on('end',function() {
            deferred.resolve({
                cookie: response.headers['set-cookie'],
                response:body
            });
        });
    });
    request.on('error', function(e) {
        deferred.reject(e);
    });
    request.write(postdata);
    request.end();
    return deferred.promise;
};