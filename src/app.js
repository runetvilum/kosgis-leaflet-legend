(function (angular) {
    'use strict';
    angular.module('rfs', [
                'ui.router',
                'ui.bootstrap',
                'rfs.directives',
                'rfs.services',
                'rfs.controllers',
                'rfs.filters',
                'ngSanitize'
            ])

    .config(['$stateProvider', '$urlRouterProvider', '$httpProvider',
    function ($stateProvider, $urlRouterProvider, $httpProvider) {
            $httpProvider.interceptors.push('jsonpInterceptor');
            //$urlRouterProvider.otherwise("/:id/indberetninger");
            $stateProvider

            .state('config', {
                url: '/:id?x&y&z',
                controller: 'config',
                templateUrl: 'templates/config.html',
                resolve: {
                    configuration: ['$stateParams', '$q', '$http',
                        function ($stateParams, $q, $http) {
                            var deferred = $q.defer();
                            $http.get('http://geo.kosgis.dk/couchdb/app-d2121ee08caf832b73a160f9ea022ad9/' + $stateParams.id + '?include_docs=true').
                            success(function (data, status, headers, config) {
                                deferred.resolve(data);

                            }).
                            error(function (data, status, headers, config) {
                                deferred.reject(data);
                            });
                            return deferred.promise;
                    }]
                }
            })

            .state('config.indberetninger', {
                url: '/indberetninger',
                controller: 'indberetninger',
                templateUrl: 'templates/indberetninger.html'
            })

            .state('config.indberetning', {
                url: '/indberetning/:indberetning',
                controller: 'indberetning',
                templateUrl: 'templates/indberetning.html'
            });
       }
   ]);
})(this.angular);