/******************************************************************************
 Copyright (c) 2016, Oracle and/or its affiliates. All rights reserved.
 $revision_history$
 13-Apr-2017   Rayes Huang, Oracle APAC
 1.0           initial creation
 ******************************************************************************/


var Constants = require('../utils/Constants');
var crypto = require('crypto');
var request = require('request');
var logger = require('../utils/Logger');
var Promise = require('bluebird');

var localResults = {};

exports.translate = function (fromLang, toLang, message) {

    return new Promise(function (resolve, reject) {
        var messageKey = encodeURI(message, 'utf8');
        if(messageKey in localResults){
            logger.info('TranslateModule', 'Found translation in Local Results:', localResults[messageKey]);
            resolve(localResults[messageKey]);
        }
        else{
            var appid = Constants.BAIDU_APPID;
            var key = Constants.BAIDU_SECRET_KEY;
            var salt = (new Date).getTime();
            var query = message;
            var from = fromLang;
            var to = toLang;
            var str1 = appid + query + salt +key;
            var sign = crypto.createHash('md5').update(new Buffer(str1, 'utf8')).digest("hex");
            var url = Constants.BAIDU_TRANSLATE_URL + '?q=' + encodeURI(query, 'utf8') + '&appid=' + appid + '&salt=' + salt + '&from=' + from + '&to=' + to + '&sign=' + sign;
            var options = {
                url: url
            };
            request.get(options, function (error, response, body) {
                logger.info('TranslateModule', 'Translate Result:', body);
                var value = JSON.parse(body).trans_result[0].dst;
                localResults[messageKey] = value;
                logger.info('TranslateModule', 'Local Results:', JSON.stringify(localResults));
                resolve(value);
            });
        }
    });
};