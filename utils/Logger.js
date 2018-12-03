var Constants = require('./Constants');
let request = require('request');
var moment = require('moment');
var winstonLogger = require('winston');
var Promise = require('bluebird');


exports.info = function (moduleName, message, data) {
		var moduleStr = moment().format('D-MMM-YYYY HH:mm:ss SSS ') + '[' + moduleName + '] :';
		var dataStr = (typeof data === 'undefined' ? '' : '( ' + JSON.stringify(data) + ' )');
		
		winstonLogger.info(moduleStr, message, dataStr);
		this.sendLog(moduleStr, message, dataStr);
};

exports.error = function (moduleName, message, data) {
		var moduleStr = moment().format('D-MMM-YYYY HH:mm:ss SSS ') + '[' + moduleName + '] :';
		var dataStr = (typeof data === 'undefined' ? '' : '( ' + JSON.stringify(data) + ' )');
	    
		winstonLogger.error(moduleStr, message, dataStr);
	    this.sendLog(moduleStr, message, dataStr);
};

exports.sendLog = function(moduleStr, message, dataStr){
	return new Promise(function (resolve, reject) {
		var body = moduleStr +  message + dataStr;
		if(Constants.LOG_SEND){
			try {
				var options = {
						url: Constants.LOG_SEND_URL,
						body: body
				};
				request.post(options, function (error, response, body) {});
			} catch (e) {
				
			}
		}
		resolve();
	});
}
