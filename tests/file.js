/* global require, module */
(function() {

    'use strict';

    var ClassObject = {

        noConsole: function () {
            console.log('should log an eslint warning');
        }

    };

    module.exports = ClassObject;

}());
