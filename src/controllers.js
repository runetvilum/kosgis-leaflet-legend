(function (angular) {
    'use strict';
    angular.module('rfs.controllers', [])

    .controller('config', ['$scope', '$rootScope', '$http', '$stateParams', 'configuration', '$window',
        function ($scope, $rootScope, $http, $stateParams, configuration, $window) {
            $rootScope.configuration = configuration;
            $rootScope.stateParams = $stateParams;
            $rootScope.$emit('configuration');
            $window.document.title = configuration.name;
        }
    ])

    .controller('indberetninger', ['$scope', '$rootScope', '$http', '$stateParams',
        function ($scope, $rootScope, $http, $stateParams) {
            $scope.showSidebar = function () {
                $rootScope.hideSidebar = !$rootScope.hideSidebar;
            };

            $rootScope.$on('overlay', function (e, layer) {
                if ($rootScope.configuration.database === layer.config.database) {
                    //console.log(layer);
                    $scope.layer = layer.data;
                }
            });
        }
    ])

    .controller('indberetning', ['$scope', '$rootScope', '$http', '$stateParams',
        function ($scope, $rootScope, $http, $stateParams) {
            $http.get('http://data.kosgis.dk/couchdb/' + $rootScope.configuration.database + '/' + $stateParams.indberetning).
            success(function (data, status, headers, config) {
                $scope.indberetning = data;
            }).
            error(function (data, status, headers, config) {
                $rootScope.error = data;
            });
        }
    ]);
})(this.angular);