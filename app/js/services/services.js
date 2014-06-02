define(['angular'], function (angular) {
    'use strict';

    var services = angular.module('App.services', [])
                            .value('version', '0.1');
    return services;
});

define(["angular", "resource"], function(angular) {
    var pubNubService = angular.module('PubNub', ["pubnub.angular.service"]);
    // you can do some more stuff here like calling app.factory()...
    return pubNubService;
});
