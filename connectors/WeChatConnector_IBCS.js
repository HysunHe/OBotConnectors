/* 
 * This is just an sample implementation to support Line integration. . Not for Prod.
 * 
 * WeChatConnector_IBCS.js - for wechat. 
 * 
 * Date: Apr, 2017
 * Author: Hysun He
 */

var Constants = require('../utils/Constants');
var request = require('request');
//var crypto = require('crypto');
var bodyParser = require('body-parser');
var _ = require('underscore');
var Promise = require('bluebird');
var wechat = require('wechat');
var logger = require('../utils/Logger');
var fs = require('fs');
var crypto = require('crypto');
var express = require('express');
//var mainMenu = require('../schemas/menu.json');
var Baidu = require('../utils/Baidu');

var WeChatConnector_IBCS = function (app, _config) {
    this.app = app;
    this.config = _config;
    this.moduleName = 'WeChatConnector_IBCS - ' + this.config.BOT_NAME;
};

WeChatConnector_IBCS.prototype.start = function () {
    var self = this;
    logger.info(self.moduleName, 'started...');

    var service = function (req, res) {
        var message = req.weixin;
        var userId = message.FromUserName;
        logger.info(self.moduleName, 'Received wechat request:' + JSON.stringify(message));
        logger.info(self.moduleName, 'User is:', userId);
        res.reply("");
        self.sendMessageToBot(userId, message).then(function (resp) {
            console.log("*** Message Sent:: ", resp);
        });
    };

    var serviceCallback = function (req, res) {
        var respJson = req.body;
        logger.info(self.moduleName, "Response body", respJson);
        var userId = respJson.userId;
        var wechatRespJson = self.transformMessageToWechatFormat(userId, respJson);
        var respMsg = null;
        if (_.isEqual(wechatRespJson.type, "text")) {
            respMsg = {
                "touser": userId,
                "msgtype": wechatRespJson.type,
                "text": {
                    "content": wechatRespJson.content
                }
            };
        } else if (_.isEqual(wechatRespJson.type, "news")) {
            respMsg = {
                "touser": userId,
                "msgtype": wechatRespJson.type,
                "news": {
                    "articles": wechatRespJson.content
                }
            };
        }
        self.getAccessToken().then(function (accessToken) {
            var options = {
                url: Constants.WECHAT_POST_MSG,
                qs: {
                    access_token: accessToken.access_token
                },
                json: true,
                body: respMsg
            };
            request.post(options, function (error, response) {
                logger.info(self.moduleName, 'Message has sent to WeChat!');
                logger.info(self.moduleName, 'Has Error?', error);
                logger.info(self.moduleName, 'Response from WeChat', response);
            });
        });
        res.status(202).send("ok");
    };

    self.app.use('/wechatib/' + self.config.BOT_NAME, wechat(self.config.WECHAT_VERIFY_TOKEN, service));

    var wechatCallback = express();
    self.app.use(bodyParser.json());
    wechatCallback.all("/", serviceCallback);
    self.app.use('/wechatcallback/' + self.config.BOT_NAME, wechatCallback);
};

WeChatConnector_IBCS.prototype.sendMessageToBot = function (userId, msg) {
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
            logger.info(self.moduleName, 'body...', botMessageString);
            request.post(options, function (error, response, body) {
                logger.info(self.moduleName, 'WeChat Response is...', response);
                if (response && response.statusCode >= 200 && response.statusCode < 300) {
                    var msg = {userId: userId, payload: body};
                    resolve(msg);
                } else {
                    logger.error(self.moduleName, "ERROR: " + JSON.stringify(error));
                    reject(error);
                }
            });
        });
    });
};

/*
 Transforms message received from facebook to BOT Engine format
 @param userId: user ID
 @param body: wechat JSON message received.
 @return formatted message
 */
WeChatConnector_IBCS.prototype.transformMessageToBotFormat = function (userId, body) {
    var self = this;
    logger.info(self.moduleName, 'transforming wechat message to BOT Engine format...', body);
    return new Promise(function (resolve, reject) {
        self.getUserProfile(userId).then(function (userProfile) {
            logger.info(self.moduleName, 'user profile is ', JSON.stringify(userProfile));
            var userNameSections = userProfile.nickname.split("\\s+");
            var firstName = userNameSections[0];
            var lastName = userNameSections[0];
            if (userNameSections.length > 1) {
                lastName = userNameSections[1];
            }
            Baidu.translate('auto', 'en', body.Content).then(function (translatedMsg) {
                var msgToBot = {
                    "userId": userProfile.openid,
                    "userProfile": {
                        "firstName": firstName,
                        "lastName": lastName,
                        "sex": userProfile.sex,
                        "language": userProfile.language,
                        "city": userProfile.city,
                        "province": userProfile.province,
                        "country": userProfile.country
                    },
                    "text": translatedMsg
                };
                resolve(msgToBot);
            });
        });
    });
};

WeChatConnector_IBCS.prototype.transformMessageToWechatFormat = function (userId, body) {
    var self = this;
    logger.info(self.moduleName, 'Transforming message to wechat format['
            + userId + "]: ", body);

    var wechatMsg = {};
    if (!_.isUndefined(body.attachment) && !_.isUndefined(body.attachment.payload)) {
        var type = body.attachment.type;
        if (_.isEqual(type, "image")) {
            wechatMsg.type = 'news';
            var item = body.attachment.payload;
            var article = {};
            if (!_.isEmpty(item.title)) {
                article.title = item.title;
            }
            if (!_.isEmpty(item.description)) {
                article.description = item.description;
            }
            if (!_.isEmpty(item.url)) {
                article.picurl = item.url;
            }
            if (!_.isEmpty(item.webUrl)) {
                article.url = item.webUrl;
            }
            wechatMsg.content = [article];
        } else if (_.isEqual(type, "template")) {
            wechatMsg.type = 'news';
            var articles = [];
            var elements = body.attachment.payload.elements;
            var count = 0;
            elements.forEach(function (item) {
                if (count++ > 8) {
                    logger.info(self.moduleName, '# of messages exceed limit, ignore the element!', item);
                    return true;
                }
                var article = {};
                if (!_.isEmpty(item.title)) {
                    article.title = item.title;
                }
                if (!_.isEmpty(item.subtitle)) {
                    article.title += " - " + item.subtitle;
                }
                if (!_.isEmpty(item.image_url)) {
                    article.picurl = item.image_url;
                }
                if (!_.isUndefined(item.default_action) && !_.isUndefined(item.default_action.url)) {
                    article.url = item.default_action.url;
                }
                articles.push(article);
            });
            wechatMsg.content = articles;
        }
    } else if (!_.isEmpty(body.text)) {
        wechatMsg.type = 'text';
        wechatMsg.content = body.text;
        if (!_.isUndefined(body.choices)) {
            if (!_.isEmpty(wechatMsg.content)) {
                wechatMsg.content = wechatMsg.content + '\n';
            }
            body.choices.forEach(function (item) {
                wechatMsg.content = wechatMsg.content + '\n' + item;
            });
        }
    }
    logger.info(self.moduleName, 'To webchat message: ', wechatMsg);
    return wechatMsg;
};

WeChatConnector_IBCS.prototype.getAccessToken = function () {
    var self = this;
    var accessTokenFile = './data/' + self.config.BOT_NAME;
    return new Promise(function (resolve, reject) {
        logger.info(self.moduleName, '***get wechat access token');

        // wechat needs acces token to be update before two hours is reached, here I check one hour
        fs.exists(accessTokenFile, function (exists) {
            var needUpdate = false;
            if (exists) {
                var fileStat = fs.statSync(accessTokenFile);
                if ((new Date().getTime() - fileStat.mtime.getTime()) / 1000 > 600) {
                    logger.info(self.moduleName, "access_token is expired: " + access_token);
                    needUpdate = true;
                } else {
                    logger.info(self.moduleName, "access_token is up-to-date.");
                }
            } else {
                logger.info(self.moduleName, "access_token does not exist.");
                needUpdate = true;
            }

            if (!needUpdate) {
                var access_token = fs.readFileSync(accessTokenFile, "utf-8");
                logger.info(self.moduleName, "access_token is from file: " + access_token);
                resolve({"access_token": access_token});
            } else {
                // update access token
                var options = {
                    url: Constants.WECHAT_API_TOKEN,
                    qs: {
                        grant_type: 'client_credential',
                        appid: self.config.WECHAT_APPID,
                        secret: self.config.WECHAT_SECRET
                    },
                    json: true
                };

                request.get(options, function (error, response, body) {
                    if (error) {
                        logger.error(self.moduleName, "!ERROR: " + JSON.stringify(error));
                        reject(error);
                    } else if (response.statusCode === 200) {
                        fs.writeFile(accessTokenFile, body.access_token, function (err) {
                            if (err)
                                throw err;
                            logger.info(self.moduleName, "access_token is updated");
                        });
                        resolve(body);
                    } else if (response.statusCode === 500) {
                        logger.error(self.moduleName, "ERROR: " + JSON.stringify(error));
                        reject(error);
                    }
                });
            }
        });
    });
};

WeChatConnector_IBCS.prototype.getUserProfile = function (userId) {
    var self = this;
    var userProfileFile = './data/Profile_' + userId;
    return new Promise(function (resolve, reject) {
        fs.exists(userProfileFile, function (exists) {
            var needUpdate = false;
            var contentString;
            if (exists) {
                var fileStat = fs.statSync(userProfileFile);
                if ((new Date().getTime() - fileStat.mtime.getTime()) / 1000 > 600) {
                    needUpdate = true;
                } else {
                    contentString = fs.readFileSync(userProfileFile, "utf-8");
                    if (!contentString || /^\s*$/.test(contentString)) {
                        needUpdate = true;
                    } else {
                        var contentJson = JSON.parse(contentString);
                        if (!contentJson.openid || contentJson.errcode === 40003) {
                            needUpdate = true;
                        }
                    }
                }
            } else {
                logger.info(self.moduleName, "User Profile does not exist.");
                needUpdate = true;
            }

            if (!needUpdate) {
                var profile = JSON.parse(contentString);
                logger.info(self.moduleName, "User Profile is from file: ", profile);
                resolve(profile);
            } else {
                logger.info(self.moduleName, 'fetching user [' + userId + '] profile from wechat...');
                self.getAccessToken().then(function (accessToken) {
                    var options = {
                        url: Constants.WECHAT_API_USER_INFO,
                        qs: {
                            access_token: accessToken.access_token,
                            openid: userId
                        },
                        json: true
                    };

                    request.get(options, function (error, response, body) {
                        if (response && response.statusCode === 200) {
                            fs.writeFile(userProfileFile, JSON.stringify(body), function (err) {
                                if (err)
                                    throw err;
                                logger.info(self.moduleName, "User Profile is updated:: " + JSON.stringify(body));
                            });
                            resolve(body);
                        } else {
                            logger.error(self.moduleName, "ERROR: " + JSON.stringify(error));
                            reject(error);
                        }
                    });
                });
            }
        });
    });
};

module.exports = WeChatConnector_IBCS;