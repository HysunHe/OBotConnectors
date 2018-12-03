/******************************************************************************
 Copyright (c) 2016, Oracle and/or its affiliates. All rights reserved.
 $revision_history$
 13-Nov-2016   Tamer Qumhieh, Oracle A-Team
 1.0           initial creation
 * Date: Apr, 2017
 * Author: Hysun He
 ******************************************************************************/


var moduleName = 'MessagePlatformServer';

// Modules Import
var Constants = require('./utils/Constants');
var fs = require('fs');
var http = require('http');
var express = require('express');
var Promise = require('bluebird');
var request = require('request');
var emitter = require('events').EventEmitter;
var logger = require('./utils/Logger');
var LineConnector_IBCS = require('./connectors/LineConnector_IBCS');
var WeChatConnector_IBCS = require('./connectors/WeChatConnector_IBCS');
var botConfigs = require('./botConfigs.json');

// initialize express
var app = express();
// This line is commented out here however added again in the FacebookConnector, as a now we added some extra security verification steps.
//app.use(bodyParser.json());
var server = http.createServer(app);

server.listen(Constants.HTTP_PORT, function () {
    logger.info(moduleName, 'Listening on ' + server.address().port);
});

// Initialize Events Emitter
var eventsEmitter = new emitter();

// Initialize & start BotEngine Connector
var botEngineConnector = require('./connectors/BotEngineConnector');
botEngineConnector.start(app, eventsEmitter);

// Initialize & start Facebook/Line/Wechat Connector
getLocalBotClientConfigs().then(function (configs) {
    configs.forEach(function (config) {
        if (config.client === 'LINE_IBCS')
        {
        	logger.info(moduleName, "Got client: " + config.config.botName);
            var botConfig = {};
            botConfig.PLATFORM_VERSION = config.config.platformVersion; // added by Cathy
            botConfig.CUSTOM_TRANSLATE = config.config.customTranslate; // added by Cathy
        	botConfig.LINE_CHANNEL_ID = config.config.channelID;
        	botConfig.LINE_CHANNEL_SECRET = config.config.appSecret;
        	botConfig.LINE_CHANNEL_ACCESS_CODE = config.config.accessToken;
        	botConfig.BOT_NAME = config.config.botName;
        	botConfig.HASH_ALGORITHM = config.config.hashAlgorithm;
            botConfig.MSG_SHARED_SECRET = config.config.msgSharedSecret;
            botConfig.MSG_RECEIVER_URL = config.config.msgReceiverEndUrl;
        	new LineConnector_IBCS(app, eventsEmitter, server, botConfig).start();
        }
        if (config.client === 'WECHAT_IBCS') {
            var botConfig = {};
            botConfig.WECHAT_VERIFY_TOKEN = config.config.verifyToken;
            botConfig.BOT_NAME = config.config.botName;
            botConfig.WECHAT_APPID = config.config.appId;
            botConfig.WECHAT_SECRET = config.config.appSecret;
            botConfig.HASH_ALGORITHM = config.config.hashAlgorithm;
            botConfig.MSG_SHARED_SECRET = config.config.msgSharedSecret;
            botConfig.MSG_RECEIVER_URL = config.config.msgReceiverEndUrl;
            new WeChatConnector_IBCS(app, botConfig).start();
        }
    });
});

function getBotClientConfigs() {
    return new Promise(function (resolve, reject) {
        logger.info(moduleName, 'Fetching Bot Client configs...');

        var options = {
            url: Constants.MCS_URL + Constants.MCS_BOT_CONFIG,
            headers: {
                'oracle-mobile-backend-id': Constants.MCS_MBE_ID,
                'Authorization': Constants.MCS_MBE_AUTH
            },
            json: true
        };

        logger.info(moduleName, "options: " + JSON.stringify(options));

        request.get(options, function (error, response, body) {
            if (response && response.statusCode >= 200 && response.statusCode < 300) {
                resolve(body);
            } else if (response && response.statusCode === 500) {
                reject(error);
            }
        });
    });
}

function getLocalBotClientConfigs() {
	return new Promise(function (resolve, reject) {
		logger.info(moduleName, 'Fetching Bot Client configs locally from botConfigs.json ...');
		resolve(botConfigs);
	});
}
