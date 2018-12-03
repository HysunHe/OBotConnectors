/******************************************************************************
 * Copyright (c) 2016-2017, Oracle and/or its affiliates. All rights reserved.
 $revision_history$
 13-Nov-2016   Tamer Qumhieh, Oracle A-Team
 1.0           initial creation
 ******************************************************************************/


exports.WS_MESSAGE_ACK_PAYLOAD = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
        "sender": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string"
                }
            },
            "required": [
                "id"
            ]
        },
        "recipient": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string"
                }
            },
            "required": [
                "id"
            ]
        },
        "timestamp": {
            "type": "integer"
        },
        "delivery": {
            "type": "object",
            "properties": {
                "mid": {
                    "type": "integer"
                }
            },
            "required": [
                "mid"
            ]
        }
    },
    "required": [
        "sender",
        "recipient",
        "timestamp",
        "delivery"
    ]
};
exports.WS_MESSAGE_PAYLOAD = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
        "sender": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string"
                }
            },
            "required": [
                "id"
            ]
        },
        "recipient": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string"
                }
            },
            "required": [
                "id"
            ]
        },
        "timestamp": {
            "type": "integer"
        },
        "message": {
            "type": "object",
            "properties": {
                "payload": {"type": "object"}
            },
            "required": [
                "payload"
            ]
        },
        "metadata": {
            "type": "object",
            "properties": {
                "authorization": {
                    "type": "string"
                },
                "language": {
                    "type": "string"
                }
            },
            "required": [
                "language"
            ]
        }
    },
    "required": [
        "sender",
        "recipient",
        "timestamp",
        "message",
        "metadata"
    ]
};
exports.REST_MESSAGE_PAYLOAD = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
        "userId": {
            "type": "string"
        },
        "channel": {
            "type": "string"
        },
        "botName": {
            "type": "string"
        },
        "payload": {
            "type": "object"
        }
    },
    "required": [
        "userId",
        "channel",
        "botName",
        "payload"
    ]
};
exports.ADMIN_CONNECTORS_PAYLOAD = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
        "action": {
            "type": "string",
            "enum": [
                "start",
                "stop",
                "restart"
            ]
        },
        "connectors": {
            "type": "string",
            "enum": [
                "FB",
                "CUSTOM",
                "ALL"
            ]
        },
        "botName": {
            "type": "string"
        }
    },
    "required": [
        "action",
        "connectors"
    ]
}