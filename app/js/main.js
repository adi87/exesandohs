requirejs.config({
    baseUrl: 'js',

    paths: {
        underscore: '../lib/underscore/underscore-min',
        angular: '../lib/angular/angular',
        resource: '../lib/angular/angular-resource',
        ngPubNub: '../lib/angular/angular-pubnub'
    },

    shim: {
        underscore: {
            exports: '_'
        },
        'angular': {
            exports: 'angular'
        },
        'states': {
            deps: ['angular'],
            exports: 'states'
        },
        'resource': {
            deps: ['angular'],
            exports: 'resource'
        },
        ngPubNub: {
            deps: ['angular','resource']
        }
    },
    priority: [
		'angular',
        'resource',
        'ngPubNub'
	]
});

requirejs(['angular',
            'app',
            'underscore',
            'resource',
            'ngPubNub',
            'routes',
            '../lib/jquery/jquery.min',
            'services/services',
            'providers/providers',
            'directives/directives',
            'filters/filters',
            'controllers/controllers'
           ], function (angular, app, _) {
               angular.element(document).ready(function () {
                   angular.bootstrap(document, ['App']);
                   document.getElementsByTagName('html')[0].dataset.ngApp = 'App';
               });

           });
