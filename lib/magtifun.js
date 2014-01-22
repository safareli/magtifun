"use strict";
//var localStorage = require('node-localstorage');
//require a few things.

var http = require('http'),
    queryString = require('querystring'),
    LocalStorage = require('node-localstorage').LocalStorage,
    localStorage = new LocalStorage(".magtifun"),
    Q = require('q'),
    NOPE = "nope",
    YAP = "yap",
    PATH = {
        LOGIN: '/index.php?page=11&lang=en',
        SEND: 'http://www.magtifun.ge/scripts/sms_send.php',
    },HELP = {
        title:"=============[Magtifun help]=============",
        available:"list of available commands:",
        login:"$ magtifun login [username] [password]",
        send:"$ magtifun send [recipients] [text]",
        logout:"$ magtifun logout"
    };
var isEmpty = function(obj){
    return obj == "" || typeof obj ==="undefined"
}
var sendPost = function(path,data){
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
            'Host':'www.magtifun.ge',
            'Origin':'http://www.magtifun.ge',
            'Referer':'http://www.magtifun.ge/index.php?page=2&lang=en',
            'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.76 Safari/537.36',
            'Cookie':localStorage.getItem('cookie')
        }
    };
//    console.log(localStorage.getItem('cookie'));
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
var Magtifun = module.exports = {
    cli:function(){
        switch(process.argv[2]){
            case 'login':
                Magtifun.login(process.argv[3],process.argv[4]).done(function(){
                    console.log(YAP);
                },function(err){
                    console.log((err && err.log) ? err.log : NOPE);
                });
            break;
            case 'logout': 
                Magtifun.logout()
                console.log(YAP);
            break;
            case 'send':
                Magtifun.send(process.argv[3],process.argv[4]).done(function(){
                    console.log(YAP);
                },function(err){
                    console.log((err && err.log) ? err.log : NOPE);
                });
            break;
            default: 
                console.log(Magtifun.help());
            break;
        }
    },
    help:function(command){
        var text = [];
        switch(command){
            case 'login': 
                text = [HELP.title,HELP.login]; 
            break;
            case 'send': 
                text = [HELP.title,HELP.send]; 
            break;
            default: 
                text = [HELP.title,HELP.available,HELP.login,HELP.send,HELP.logout]; 
            break;
        }
        return text.join('\n');
    },
    login:function(userName,passWord){
        var deferred = Q.defer();
        if(isEmpty(userName) || isEmpty(passWord)){
            deferred.reject({log:Magtifun.help('login')});
            return deferred.promise;
        }
        sendPost(PATH.LOGIN,{
            password:passWord,
            user:userName, 
            act:'1',
            remember:'on'
        }).then(function(data){
            if(!data.response.match("Welcome")){
                deferred.reject({}); 
                return;
            }
            var cookie = "";
            for(var i = 0; i <data.cookie.length; i++){
                cookie+= ";" + data.cookie[i].split(';')[0];
            }
            localStorage.setItem('cookie',cookie);
            localStorage.setItem('username',userName);
            localStorage.setItem('password',passWord);
            deferred.resolve(); 
        },function(e){
            deferred.reject({error:e});
        });
        return deferred.promise;
    },
    logout:function(){
        localStorage.clear();
    },
    send:function(numbers,message){
        var deferred = Q.defer();
        if(isEmpty(numbers) || isEmpty(message)){
            deferred.reject({log:Magtifun.help('send')});
            return deferred.promise;
        }
        sendPost(PATH.SEND,{
            recipients : numbers,
            message_body : message
        }).done(function(data){
            if(data.response.match("success")){
                deferred.resolve(); 
            }else{
                deferred.reject({log:data.response});
            }
        },function(e){
            deferred.reject({error:e});
        });
        return deferred.promise;
    },
}