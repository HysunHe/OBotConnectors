/* 
 * This is just an sample implementation to support Line integration. . Not for Prod.
 * 
 * LineConnector_IBCS.js - for wechat. 
 * 
 * Date: Apr, 2017
 * Author: Hysun He
 */

var Constants = require('../utils/Constants');
var _ = require('underscore');
var Promise = require('bluebird');
// LINEBot is a Line Messenger Bot Framework, it makes it easy to read
var LINEBot = require('line-messaging');
// Initialize Logger
var logger = require('../utils/Logger');
var eventEmitter;
var bot;
var express = require('express');
var request = require('request');
var crypto = require('crypto');
var bodyParser = require('body-parser');
var Microsoft = require('../utils/Microsoft');



var LineConnector_IBCS = function (app, eveEmitter, server, _config) {
    this.app = app;
    this.eventEmitter = eveEmitter;
    this.config = _config;
    this.moduleName = 'LineConnector_IBCS - ' + this.config.BOT_NAME;
    this.bot = LINEBot.create({
        channelID: this.config.LINE_CHANNEL_ID,
        channelSecret: this.config.LINE_CHANNEL_SECRET,
        channelToken: this.config.LINE_CHANNEL_ACCESS_CODE
    }, server);


}

// Initialize the Line Connector and set all needed listeners.
LineConnector_IBCS.prototype.start = function () {

    var self = this;
    self.app.use(self.bot.webhook("/line_ibcs/" + this.config.BOT_NAME));

    // callback for IBCS
    var serviceCallback = function (req, res) {
        var body = req.body;
        logger.info(self.moduleName, "got message from IBCS", body);
        self.sendMessageToLine(body, 1);
        res.status(202).send("ok");
    };
    var lineCallback = express();
    self.app.use(bodyParser.json());
    lineCallback.all("/", serviceCallback);
    self.app.use('/line_callback/' + self.config.BOT_NAME, lineCallback);

    // Listen for Line events. These events are fired when BOT Engine sends back a reply through BotEngineConnector,
    // hence LineConnector_IBCS needs to listen for these incoming message and direct them back to Line Server for delivery.
    self.eventEmitter.on(Constants.EVENT_SEND_TO_LINE + self.config.BOT_NAME, function (message) {
        logger.info(self.moduleName, 'BotEngine EventEmitting - bot');
        self.sendMessageToLine(message, 1);
    });


    logger.info(self.moduleName, 'successfully init Line connector');

    // Listen for Line incoming Free Text messages
    self.bot.on(LINEBot.Events.MESSAGE, function (replyToken, message) {
        if (message.isMessageType('text')) {
            logger.info(self.moduleName, 'bot - received a free textMessage message from user [' + message.getUserId() + ']...', message.getText());
            var payload = {
                text: message.getText()
            };
            self.sendMessageToBot(message.getUserId(), payload, 1);
        } else {
            logger.info(self.moduleName, 'received a non-textMessage message from user [' + message.getUserId() + ']...', message.getType());
            var payload = {
                address: message.getAddress(),
                location: {
                    "lat": message.getLatitude(),
                    "long": message.getLongitude()
                }
            };
            self.sendMessageToBot(message.getUserId(), payload, 1);
        };

    });



    // Listen for Line incoming Button postback messages
    self.bot.on(LINEBot.Events.POSTBACK, function (replyToken, message) {
        logger.info(self.moduleName, 'Postback  received a button postback message from user [' + message.getUserId() + ']...', message);
        var payload = {
            text: message.getPostbackData()
        };
        self.sendMessageToBot(message.getUserId(), payload, 1);
    });

};

/*
 Send message to BOT by firing an postbackEvent_toBot
 @param msg: JSON object representing the message received from Client and to be sent to BOT
 */
LineConnector_IBCS.prototype.sendMessageToBot = function (userId, msg, pageId) {

    var self = this;
    return new Promise(function (resolve, reject) {
        self.transformMessageToBotFormat(userId, msg).then(function (botMessage) {
            logger.info(self.moduleName, 'Sending message to BotEngine...', botMessage);
            var botMessageString = JSON.stringify(botMessage);
            var secret = self.config.MSG_SHARED_SECRET;
            signature = self.config.HASH_ALGORITHM + '=' + crypto.createHmac(self.config.HASH_ALGORITHM, secret)
                .update(new Buffer(botMessageString, 'utf8')).digest('hex');
            var options = {
                url: self.config.MSG_RECEIVER_URL,
                headers: {
                    'X-Hub-Signature': signature,
                    'Content-Type': 'application/json'
                },
                json: true,
                body: botMessage
            };
            logger.info(self.moduleName, 'URL...', self.config.MSG_RECEIVER_URL);
            logger.info(self.moduleName, 'X-Hub-Signature...', signature);
            request.post(options, function (error, response, body) {
                logger.info(self.moduleName, 'Response of sending to IBCS is...', response);
                if (response && response.statusCode === 202) {
                    logger.info(self.moduleName, "send to IBCS OK");
                    resolve("ok");
                } else {
                    logger.error(self.moduleName, "send to IBCS ERROR: " + JSON.stringify(error));
                    reject(error);
                }
            });
        });
    });
};


/*
 Transforms message received from line to BOT Engine format
 @param userId: user ID
 @param body: message received.
 @return formatted message
 */
LineConnector_IBCS.prototype.transformMessageToBotFormat = function (userId, body) {
    var self = this;
    return new Promise(function (resolve, reject) {
        //getUserProfile(userId).then(function (userProfile) {
        logger.info(self.moduleName, 'transforming message to BOT Engine format...', body);

        var text = body.text ? body.text : body; // location, no need to translate

        self.bot.getProfile(userId).then(function (userProfile) {
            // add your code when success.
            logger.info(self.moduleName, "get user profile:" + JSON.stringify(userProfile));
            var formatFunc = function (text) {
                var msgToBot = {};
                // Platform version v1.1 Conversation Model
                if (self.config.PLATFORM_VERSION === "1.1") {
                    msgToBot = {
                        "userId": userId,
                        "profile": {
                            "firstName": userProfile.displayName,
                            "lastName": null,
                            "gender": null,
                            "channel": "line"
                        },
                        "messagePayload": {
                            "type": "text",
                            "text": text
                        }
                    };
                    // 2018-08-09 add postback type
                    try {
                        var jsonObj = JSON.parse(text);
                        if(jsonObj.type === "postback"){
                            msgToBot.messagePayload.type = jsonObj.type;
                            msgToBot.messagePayload.postback = jsonObj.postback;
                        }
                    } catch (error) {
                    }
                    
                }
                // Platform version v1.0 Simple Model
                else {
                    msgToBot = {
                        "userId": userId,
                        "userProfile": {
                            "userName": userProfile.displayName,
                            "sex": null,
                            "language": null,
                            "city": null,
                            "province": null,
                            "country": null,
                            "channel": "line"
                        },
                        "text": text
                    };
                }
                //
                resolve(msgToBot);
            };

            if (self.config.CUSTOM_TRANSLATE.toUpperCase() === "true".toUpperCase() && body.text) {
                // translate with microsoft api
                Microsoft.translate(text, 'zh-TW', 'en').then(formatFunc);
            } else {
                formatFunc(text);
            }
        }).catch(function (error) {
            // add your code when error.
            logger.error(self.moduleName, "get user profile fail" + JSON.stringify(error));
        });


    });

};


LineConnector_IBCS.prototype.formatMsgPayload = function (message) {
    var self = this;
    var payload = {};
    switch (message.messagePayload.type.toLowerCase()) {
        // text:
        case "text":
            payload.text = message.messagePayload.text.substring(0, 60);
            var ifURLBtn = false;
            if (message.messagePayload.actions) {
                for (var i = 0; i < message.messagePayload.actions.length; i++) {
                    if (message.messagePayload.actions[i].type.toLowerCase() === 'url')
                        ifURLBtn = true;
                }
            }
            if (ifURLBtn) {
                var title = payload.text.substring(0, 60);
                var columns = [];
                var item = {};
                item.title = title;
                item.text = item.title.substring(0, 60);
                item.actions = [];
                for (var i = 0; i < message.messagePayload.actions.length; i++) {
                    var actionItem = message.messagePayload.actions[i];
                    switch (actionItem.type.toLowerCase()) {
                        case "url":
                            item.actions.push({
                                "type": "uri",
                                "label": actionItem.label,
                                "uri": actionItem.url
                            });
                            break;
                        case "postback":
                            item.actions.push({
                                "type": "message",
                                "label": actionItem.label,
                                "text": actionItem.label
                            });
                            break;
                    }
                    columns.push(item);
                }
                payload = {
                    "text": title,
                    "type": "template",
                    "altText": title,
                    "template": {
                        "type": "carousel",
                        "columns": columns
                    }
                };

            } else if (message.messagePayload.actions) {
                payload.choices = [];
                // Max: 4
                var buttons_num = message.messagePayload.globalActions ? (message.messagePayload.globalActions.length < 4 ? (4 - message.messagePayload.globalActions.length) : 0) : 4;
                var max_num = message.messagePayload.actions.length > buttons_num ? buttons_num : message.messagePayload.actions.length;
                for (var i = 0; i < max_num; i++) {
                    // Max: 20
                    payload.choices.push(message.messagePayload.actions[i].label.substring(0, 20));
                }
                if (message.messagePayload.globalActions) {
                    for (var i = 0; i < message.messagePayload.globalActions.length; i++) {
                        // Max: 20
                        payload.choices.push(message.messagePayload.globalActions[i].label.substring(0, 20));
                    }

                }

            }

            break;
            // CRC: build-in bot Common Response Component
        case 'raw':
            var title = "Select";
            payload = message.messagePayload.payload;
            break;
        case 'card':
            var title = "Select";
            var columns = [];
            for (var i = 0; i < message.messagePayload.cards.length; i++) {
                var item = {};
                var cardItem = message.messagePayload.cards[i];
                item.title = cardItem.title;
                item.thumbnailImageUrl = cardItem.imageUrl;
                item.text = cardItem.description ? cardItem.description : item.title;
                item.text = item.text.substring(0, 60);
                item.actions = [];
                if (!cardItem.actions) {
                    cardItem.actions = [];
                    cardItem.actions.push({
                        "type": "postback",
                        "label": "OK",
                    });
                }

                // Max 10
                var buttons_num = message.messagePayload.globalActions ? (message.messagePayload.globalActions.length < 10 ? (10 - cardItem.actions.length) : 0) : 10;
                var max_num = cardItem.actions.length > buttons_num ? buttons_num : cardItem.actions.length;
                // normal action first
                for (var j = 0; j < max_num; j++) {
                    var actionItem = cardItem.actions[j];
                    switch (actionItem.type.toLowerCase()) {
                        case "url":
                            item.actions.push({
                                "type": "uri",
                                "label": actionItem.label.substring(0, 20),
                                "uri": actionItem.url
                            });
                            break;
                        case "postback":
                            let data = actionItem.label;
                            if(actionItem.type === 'postback' && actionItem.postback){
                                data = JSON.stringify(actionItem);
                            }
                            item.actions.push({
                                //    "type": "message",
                                "type": LINEBot.Action.POSTBACK,
                                "label": actionItem.label.substring(0, 20),
                                "text": data.substring(0, 300)
                            });
                            break;
                    }
                }
                // Then Global Actions
                if (message.messagePayload.globalActions) {
                    for (var j = 0; j < message.messagePayload.globalActions.length; j++) {
                        let data = message.messagePayload.globalActions[j].label, typeStr = "message";
                        if(message.messagePayload.globalActions[j].type === 'postback' 
                            && message.messagePayload.globalActions[j].postback){
                            typeStr = message.messagePayload.globalActions[j].type;
                            data = JSON.stringify(message.messagePayload.globalActions[j]);
                        }
                        // Max: 20
                        item.actions.push({
                            "type": typeStr,
                            "label": message.messagePayload.globalActions[j].label.substring(0, 20),
                            "text": data.substring(0, 300)
                        });
                    }
                }
                columns.push(item);
            }
            payload = {
                "text": title,
                "type": "template",
                "altText": title,
                "template": {
                    "type": "carousel",
                    "columns": columns
                }
            };
            break;
    }
    payload.userId = message.userId;
    logger.info(self.moduleName, 'After conversation model format: ', payload);
    return payload;
};
/*
 send message(s) from BOT Engine to Line server.
 @param message: message received from BOT Engine
 */
LineConnector_IBCS.prototype.sendMessageToLine = function (message, pageId) {

    var self = this;
    var body = message;
    // // ibcs
    // if(!body.text) {
    // 	logger.info(self.moduleName, '!!! body.text is null!!!');
    // 	return;
    // }

    // decide type
    var type;
    var payload;
    // for build-in bot message, format it first
    if (body.messagePayload) {
        body = self.formatMsgPayload(body);
    }

    if (body.text) {
        type = 'text';
    }
    if (body.choices) {
        type = 'buttons';
    }
    if (body.template) {
        type = body.type;
    }
    if (body.type && body.type === "image") {
        type = 'image';
    }
    if (body.type && body.type === "imagemap") {
        type = 'imagemap';
    }

    // create payload
    switch (type) {
        case 'text':
            self.bot.pushTextMessage(body.userId, body.text);
            logger.info(self.moduleName, 'ok sending line textMessage message to user [' + body.userId + ']...', body);
            break;
        case 'buttons':
            //
            var actions = [];
            body.choices.forEach(function (optionItem) {
                logger.info(self.moduleName, 'sending button to Line format...', optionItem);
                actions.push(new LINEBot.MessageTemplateAction(optionItem, optionItem));
            });

            if (pageId == 1) {
                var title = "Please choose";
                if (body.title && body.title.length > 0) {
                    title = body.title;
                }
                var buttonTemplate = new LINEBot.ButtonTemplateBuilder(title, body.text, null /* Constants.LINE_IMG */ , actions);
                var messageBuilder = new LINEBot.TemplateMessageBuilder('this is a buttons template', buttonTemplate);
                var data = self.bot.pushMessage(body.userId, messageBuilder);
            }
            logger.info(self.moduleName, 'ok sending line buttons to user [' + body.userId + ']...', body);
            break;
        case 'image':
            self.bot.pushImageMessage(body.userId, body.originalContentUrl, body.previewImageUrl);
            logger.info(self.moduleName, 'Line got image from IBCS:');
            break;
        case 'imagemap':
            var data = self.bot.pushMessage(body.userId, self.createLineImageMapBuilder(body));
            logger.info(self.moduleName, 'Line got imagemap from IBCS:', body);
            break;
        case 'template':
            logger.info(self.moduleName, 'Line got template from IBCS:');
            if (body.template.type === LINEBot.Template.BUTTONS) {
                var buttons = new LINEBot.ButtonTemplateBuilder();
                buttons.setTitle(body.template.title);
                buttons.setMessage(body.template.text);
                buttons.setThumbnail(body.template.thumbnailImageUrl);
                self.createLineButtons(buttons, body.template.actions);

                // body.template.actions, .forEach(function(item, index) {
                //     if (item.type.toUpperCase() === LINEBot.Action.MESSAGE.toUpperCase()) {
                //         // label, data/url, type
                //         buttons.addAction(item.label, item.text, item.type);
                //     } else if (item.type.toUpperCase() === LINEBot.Action.POSTBACK.toUpperCase()) {} else if (item.type.toUpperCase() === LINEBot.Action.URI.toUpperCase()) {}
                // });

                var messageBuilder = new LINEBot.TemplateMessageBuilder(body.altText, buttons);
                var data = self.bot.pushMessage(body.userId, messageBuilder);
            } else if (body.template.type === LINEBot.Template.CAROUSEL) {
                var columns = [];
                body.template.columns.forEach(function (item, index) {
                    var column = new LINEBot.CarouselColumnTemplateBuilder();
                    column.setTitle(item.title)
                        .setMessage(item.text)
                        .setThumbnail(item.thumbnailImageUrl);
                    self.createLineButtons(column, item.actions);
                    columns.push(column);
                });

                var carousel = new LINEBot.CarouselTemplateBuilder(columns);
                var messageBuilder = new LINEBot.TemplateMessageBuilder(body.altText, carousel);
                var data = self.bot.pushMessage(body.userId, messageBuilder);
            }

            logger.info(self.moduleName, 'ok sending line template to user [' + body.userId + ']...', body);
            break;
    }
};


LineConnector_IBCS.prototype.createLineButtons = function (templateBuilder, actionsArray) {
    actionsArray.forEach(function (item, index) {
        if (item.type.toUpperCase() === LINEBot.Action.MESSAGE.toUpperCase()) {
            // label, data/url, type
            templateBuilder.addAction(item.label.substring(0, 20), item.text, item.type);
        } else if (item.type.toUpperCase() === LINEBot.Action.URI.toUpperCase()) {
            // label, data/url, type
            templateBuilder.addAction(item.label.substring(0, 20), item.uri, item.type);
        } else if (item.type.toUpperCase() === LINEBot.Action.POSTBACK.toUpperCase()) {
            templateBuilder.addAction(item.label.substring(0, 20), item.text, item.type);
        }
    });
}

LineConnector_IBCS.prototype.createLineImageMapBuilder = function (body) {
    // var imagemap = new LINEBot.ImagemapMessageBuilder();
    // imagemap.setImageBase(body.baseUrl+"/460");
    // imagemap.setAlternate(body.altText);
    // imagemap.setBaseSize(460, 460);

    // // message/url, x, y, with, height, type 
    // imagemap.addAction('https://www.google.com/maps/search/bank+branches/@28.6548121,77.1085586,11.25z', 0, 0, 460, 460, LINEBot.Action.URI);

    var imagemap = new LINEBot.ImagemapMessageBuilder();
    imagemap.setImageBase(body.baseUrl);
    imagemap.setAlternate(body.altText);
    imagemap.setBaseSize(body.baseSize.width, body.baseSize.height);


    body.actions.forEach(function (item, index) {
        if (item.type.toUpperCase() === LINEBot.Action.URI.toUpperCase()) {
            // message/url, x, y, width, height, type
            imagemap.addAction(item.linkUri, item.area.x, item.area.y, item.area.width, item.area.height, LINEBot.Action.URI);
        }
    });

    return imagemap;
}

/*
 Fetch user profile from Line

function getUserProfile(userId) {
    logger.info(self.moduleName, 'fetching user [' + userId + '] profile from Line...');
    var profile = bot.getProfile(userId);
    logger.info(self.moduleName, 'profile info: ' + profile.toString());
    return profile;
};
*/

function sleep(milliseconds) {
    var start = new Date().getTime();
    while (true) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
};


module.exports = LineConnector_IBCS;