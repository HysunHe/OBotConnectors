// log
exports.LOG_SEND=true;
exports.LOG_SEND_URL='http://ddf69b03.ngrok.io';

// Message Platform default settings
exports.HTTP_PORT = process.env.PORT || 9090;
exports.LANGUAGE_EN = 'en';
exports.LANGUAGE_ES = 'es';
exports.DEFAULT_LANGUAGE  = this.LANGUAGE_EN;
exports.KEYWORD_MENU = 'menu';
exports.KEYWORD_STARTOVER = 'startOver';
exports.MESSAGE_SEND_MAX_RETRY_COUNT=3;
exports.MESSAGE_SEND_RETRY_INTERVAL = 3000;
exports.CLIENT_FB = 'FB';
exports.CLIENT_CUSTOM = 'CUSTOM';
exports.CLIENT_WECHAT = 'WECHAT';


// MCS Setup
exports.MCS_URL = 'https://apacdemo6-apacdemo6.mobileenv.us2.oraclecloud.com:443/mobile/custom';
exports.MCS_BOT_ENDPOINT = '/appdevchatbot/chat?bot=';
// exports.MCS_BOT_ENDPOINT = '/freetxtchatbot/chat?bot=';
exports.MCS_MESSAGES_STORE = '/freetxtmcsmessageplatform/message';
exports.MCS_MESSAGES_STORE_ENDPOINT = '/freetxtmcsmessageplatform/message';
exports.MCS_BOT_CONFIG = '/freetxtmcsmessageplatform/botclientconfig';
exports.MCS_MBE_ID = '608ff73b-4bcb-45d7-99cc-347d249c9717';
exports.MCS_MBE_AUTH = 'Basic bWNzX2NoYXRib3R1c2VyOkNvbWVXZWwxIyE=';
exports.MCS_RIGHTNOW_ENDPOINT = function (chatSessionId , botName) {
    return '/rightnowcomponents/chats/' + chatSessionId + '/messages/' + botName;
};

// Events name
exports.EVENT_SEND_TO_BOT = 'send_botEngine';
exports.EVENT_SEND_TO_WEBSOCKET = 'send_websocket';
exports.EVENT_SEND_TO_FACEBOOK = 'send_facebook';
exports.EVENT_SEND_TO_LINE = 'send_line';
exports.EVENT_SEND_TO_WECHAT = 'send_wechat';

// Facebook Specific Constraints
exports.FACEBOOK_LIMIT_BUTTONS_TEXT = 3;
exports.FACEBOOK_LIMIT_BUTTONS_CARD_VERTICAL_LIST = 1;
exports.FACEBOOK_LIMIT_BUTTONS_CARD_HORIZONTAL_LIST = 3;
exports.FACEBOOK_LIMIT_BUTTONS_VERTICAL_LIST = 1;
exports.FACEBOOK_LIMIT_BUTTONS_QUICK_REPLIES = 11;
exports.FACEBOOK_LIMIT_CARDS_VERTICAL_LIST = 4;
exports.FACEBOOK_LIMIT_CARDS_HORIZON_LIST = 10;

// Wechat
exports.WECHAT_API_TOKEN='https://api.weixin.qq.com/cgi-bin/token';
exports.WECHAT_API_USER_INFO='https://api.weixin.qq.com/cgi-bin/user/info';
exports.WECHAT_CREATE_MENU='https://api.weixin.qq.com/cgi-bin/menu/create';
exports.WECHAT_PROXY_PAGE='https://chatbotProxyPage-gse00002994.apaas.us6.oraclecloud.com/';
exports.WECHAT_POST_MSG='https://api.weixin.qq.com/cgi-bin/message/custom/send';

// Message type
exports.MESSAGE_TYPE_WS_ACK = 0;
exports.MESSAGE_TYPE_WS_TEXT_BUTTON = 1;
exports.MESSAGE_TYPE_FB_TEXT=2;
exports.MESSAGE_TYPE_FB_CARDS_HORIZONTAL = 3;
exports.MESSAGE_TYPE_FB_POSTBACK_BUTTON=4;
exports.MESSAGE_TYPE_FB_CARDS_VERTICAL = 5;
exports.MESSAGE_TYPE_FB_ATTACHMENT = 6;


// LINE Messagen type
exports.MESSAGE_TYPE_LINE_TEXT=1;
exports.MESSAGE_TYPE_LINE_CARDS = 3;
exports.MESSAGE_TYPE_LINE_BUTTON=4;
exports.LINE_IMG='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMjuLwL_U2esYsNa1OWsc01DpYZvKqhGHuo06mUHI91Kq6SzkM';


// BOT Engine conversation states
exports.BOT_EVENTID_FREE_TEXT = 'textSent';
exports.BOT_EVENTID_IMAGE = 'imageSent';
exports.BOT_EVENTID_AUDIO = 'audioSent';
exports.BOT_EVENTID_VIDEO = 'videoSent';
exports.BOT_EVENTID_LOCATION = 'locationSent';
exports.BOT_EVENTID_START = 'start';


// BOT Engine Response Items Dictionary
exports.DICTIONARY_BOT_ITEM_TITLE = 'title';
exports.DICTIONARY_BOT_ITEM_SUBTITLE = 'subtitle';
exports.DICTIONARY_BOT_ITEM_IMAGEURL= 'imageUrl';
exports.DICTIONARY_BOT_ITEM_ITEMURL = 'itemUrl';
exports.DICTIONARY_BOT_ITEM_CARDURL = 'cardUrl';
exports.DICTIONARY_BOT_ITEM_OPTIONS = 'options';
exports.DICTIONARY_BOT_ITEM_PROMPT = 'prompt';
exports.DICTIONARY_BOT_ITEM_GLOBALOPTIONS = 'globalOptions';


// Facebook Template Response Dictionary
exports.DICTIONARY_FACEBOOK_ITEM_TITLE = 'title';
exports.DICTIONARY_FACEBOOK_ITEM_SUBTITLE = 'subtitle';
exports.DICTIONARY_FACEBOOK_ITEM_IMAGEURL = 'image_url';
exports.DICTIONARY_FACEBOOK_ITEM_ITEMURL = 'item_url';
exports.DICTIONARY_FACEBOOK_ITEM_CARDURL = 'default_action';
exports.DICTIONARY_FACEBOOK_ITEM_OPTIONS = 'buttons';
exports.DICTIONARY_FACEBOOK_ITEM_PROMPT = 'title';
exports.DICTIONARY_FACEBOOK_ITEM_GLOBALOPTIONS = 'quick_replies';


// Error Codes & Messages
exports.ERROR_CODE_INVALID_MESSAGE = 1234;
exports.ERROR_MSG_INVALID_MESSAGE = 'message received is not a valid message...';
exports.ERROR_CODE_USERID_REQUIRED = 5678;
exports.ERROR_MSG_USERID_REQUIRED = 'UserId is required, websocket connection will terminate after 1 second . UserId should be passed upon initiating websocket connection in the format of wss://SERVER:PORT/USER_ID...';

//Baidu Translate
exports.BAIDU_TRANSLATE_URL = 'http://api.fanyi.baidu.com/api/trans/vip/translate';
exports.BAIDU_APPID = '20170410000044484';
exports.BAIDU_SECRET_KEY = 'xxxxxxxxxxxxxx';

//microsoft Translate
exports.MS_TOKEN_URL = 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken';
exports.MS_KEY = 'xxxxxxxxxxxxxxx';
exports.MS_TRANSLATE_URL = 'https://api.microsofttranslator.com/V2/Http.svc/Translate';

