/******************************************************************************
 * Copyright (c) 2016-2017, Oracle and/or its affiliates. All rights reserved.
 $revision_history$
 16-JAN-2017   Tamer Qumhieh, Oracle A-Team
 1.0           initial creation
 ******************************************************************************/


exports.Helper = (function () {
    function isArrayLike(value) {
        return value
            && typeof value === 'object'
            && typeof value.length === 'number'
            && value.length >= 0
            && value.length % 1 === 0;
    }

    function isArray(value) {
        return Array.isArray(value);
    }

    function isFunction(value) {
        // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
        // IE 11 (#1621), and in Safari 8 (#1929).
        return typeof value === "function" || false;
    }

    var isEmpty = function (value) {
        if (value === null) {
            return true;
        }

        // check if the value has length
        if (isArrayLike(value)
            && (isArray(value)
            || typeof value === 'string' // is string
            || isFunction(value.splice) // is array
            || isFunction(value.callee))) { // is arguments
            return !value.length;
        }

        // check if the object iis set or map
        if (!!value && typeof value == 'object') {
            var str = value.toString();
            if (str == '[object Map]' || str == '[object Set]') {
                return !value.size;
            }
        }

        // check if the object has properties
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }

    function isTypeOf(name, obj) {
        return toString.call(obj) === '[object ' + name + ']';
    }

    function isString(value) {
        return isTypeOf('String', value);
    }

    function isNumber(value) {
        if (typeof value == 'number') {
            return true;
        }
        return value.toString() == '[object Number]';
    }

    function isObject(value) {
        var type = typeof value;
        return type === 'function' || type === 'object' && !!value;
    }

    // Is the given value `NaN`? (NaN is the only number which does not equal itself).
    function isNaN(value) {
        return isNumber(value) && value !== +value;
    }

    function isFloat(n) {
        if (isObject(n) && isNaN(n) && isNumber(n)) return false;
        return Number(n) === n && n % 1 !== 0;
    }

    return {
        isEmpty: isEmpty,
        isFloat: isFloat,
        isNaN: isNaN,
        isObject: isObject,
        isNumber: isNumber,
        isString: isString
    }
})();