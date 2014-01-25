"use strict";

var settings = require('./settings.js'),
    request = require('./request.js'),
    LocalStorage = require('node-localstorage').LocalStorage,
    localStorage = new LocalStorage(".magtifun"),
    Q = require('q');

var areEmpty = function(){
    for(var i =0; i <arguments.length;i++){
        if(arguments[i] == "" || typeof arguments[i] ==="undefined")
            return true;
    }
    return false;
}
var Magtifun = module.exports = {
    cli:function(){
        switch(process.argv[2]){
            case 'login':
                Magtifun.login(process.argv[3],process.argv[4]).done(function(){
                    console.log(settings.YAP);
                },function(err){
                    console.log((err && err.log) ? err.log : settings.NOPE);
                });
            break;
            case 'logout': 
                Magtifun.logout()
                console.log(settings.YAP);
            break;
            case 'send':
                Magtifun.send(process.argv[3],process.argv[4]).done(function(){
                    console.log(settings.YAP);
                },function(err){
                    console.log((err && err.log) ? err.log : settings.NOPE);
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
                text = [
                    settings.HELP.title,
                    settings.HELP.login
                ]; 
            break;
            case 'send': 
                text = [
                    settings.HELP.title,
                    settings.HELP.send
                ]; 
            break;
            default: 
                text = [
                    settings.HELP.title,
                    settings.HELP.available,
                    settings.HELP.login,
                    settings.HELP.send,
                    settings.HELP.logout
                ]; 
            break;
        }
        return text.join('\n');
    },
    login:function(userName,passWord){
        var deferred = Q.defer();
        if(areEmpty(userName,passWord)){
            deferred.reject({log:Magtifun.help('login')});
            return deferred.promise;
        }
        request.post(settings.PATH.LOGIN,{
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
        if(areEmpty(numbers,message)){
            deferred.reject({log:Magtifun.help('send')});
            return deferred.promise;
        }
        request.post(settings.PATH.SEND,{
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