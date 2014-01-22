"use strict";
//var localStorage = require('node-localstorage');
//require a few things.

var http = require('http'),
    queryString = require('querystring'),
    LocalStorage = require('node-localstorage').LocalStorage,
    localStorage = new LocalStorage(".magtifunStorage"),
    Q = require('q'),
    PATH = {
        LOGIN: '/index.php?page=11&lang=en',
        SEND: 'http://www.magtifun.ge/scripts/sms_send.php',
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
    console.log(localStorage.getItem('cookie'));
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
        if(process.argv.length < 3) return Magtifun.help();
        switch(process.argv[2]){
            case 'login':  return Magtifun.login(process.argv[3],process.argv[4]);
            case 'logout': return Magtifun.logout();
            case 'send':   return Magtifun.send(process.argv[3],process.argv[4]);
            case 'help':   return Magtifun.help();
            default:       return Magtifun.help();
        }
    },
    help:function(command){
        if (command){
            console.log("TODO HELP "+command);
        }else{
            console.log("TODO help");
        }
    },
    login:function(userName,passWord){
        if(isEmpty(userName) || isEmpty(passWord)){
            return Magtifun.help('login');
        }
        sendPost(PATH.LOGIN,{
            password:passWord,
            user:userName, 
            act:'1',
            remember:'on'
        }).fail(function(){
            console.log(arguments);
        }).done(function(data){
            if(data.response.match("Welcome")){
                console.log("yap");
                var cookie = "";
                for(var i = 0; i <data.cookie.length; i++){
                    cookie+= ";" + data.cookie[i].split(';')[0];
                }
                localStorage.setItem('cookie',cookie);
                localStorage.setItem('username',userName);
                localStorage.setItem('password',passWord);
            }else{ 
                console.log("nope");
            }
        });
    },
    logout:function(){
        localStorage.clear();
        console.log("ok");
    },
    send:function(numbers,message){
        if(isEmpty(numbers) || isEmpty(message)){
            return Magtifun.help('send');
        }
        sendPost(PATH.SEND,{
            recipients : numbers,
            message_body : message
        }).fail(function(){
            console.log(arguments);
        }).done(function(data){
            if(data.response.match("success")){
                console.log("yap");
            }else if (data.response.match("not_logged_in")){
                console.log("not_logged_in");
            }else{
                console.log(data.response);
                console.log("nope");
            }
        });
    },
}