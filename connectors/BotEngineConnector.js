/******************************************************************************
 * Copyright (c) 2016, Oracle and/or its affiliates. All rights reserved.
 * This is just an sample implementation to support Line integration. Not for Prod.
 * $revision_history$
 * 13-Nov-2016   Tamer Qumhieh, Oracle A-Team
 * 1.0           initial creation
 * Date: Apr, 2017
 * Author: Hysun He
 ******************************************************************************/

var moduleName = 'BotEngineConnector';
var logger = require('../utils/Logger');
var request = require('request');
var Constants = require('../utils/Constants');
var eventsEmitter;

// Initialize the BotEngine Connector and set all needed listeners.
// @param app: express HTTP app to bind to.
exports.start = function (app, evEmitter) {
    eventsEmitter = evEmitter;

    // Listener to Constants.EVENT_SEND_TO_BOT postbackEvent_toBot. WHen recieving this postbackEvent_toBot, simply forward to BOT Engine.
    eventsEmitter.on(Constants.EVENT_SEND_TO_BOT, function (message) {
        sendMessageToBot(message)
    });
};

function sendMessageToBot(message) {
    logger.info(moduleName, 'sending message to Bot Engine...', message.payload);

    var options = {
        url: Constants.MCS_URL + Constants.MCS_BOT_ENDPOINT + message.botName,
        headers: {
            'oracle-mobile-backend-id': Constants.MCS_MBE_ID,
            'Authorization': Constants.MCS_MBE_AUTH
        },
        json : true,
        body: message.payload
    };
    
    request.post(options, function (error, response, body) {
        logger.info(moduleName, 'sending message to Bot Engine...[Return]', response);
        if(response && response.statusCode === 200)
        {
            var msg = {userId : message.userId , payload: body};
            eventsEmitter.emit(message.replyBackTo , msg);
        }

    });
};
