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
(function (document, L, angular) {
    'use strict';
    L.Control.RFS = L.Control.extend({
        options: {
            position: 'topright'
        },
        initialize: function (options) {
            L.Util.setOptions(this, options);
            angular.module('rfs').run(['$rootScope',
                function ($rootScope) {
                    $rootScope.kfticket = options.kfticket;
                    $rootScope.sagsbehandler = options.sagsbehandler;
                    $rootScope.hideSidebar = options.hideSidebar;
                }]);
        },
        onAdd: function (map) {
            angular.module('rfs').run(['$rootScope',
                function ($rootScope) {
                    $rootScope.map = map;
                }]);
            var container = angular.element('<leaflet-legend></leaflet-legend>'),
                navbar = angular.element('<leaflet-navbar></leaflet-navbar>'),
                sidebar = angular.element('<div ui-view class="sidebar" ng-show="sagsbehandler && !hideSidebar"></div>');
            angular.element(document.body).prepend(sidebar).prepend(navbar);

            angular.element(container).ready(function () {
                angular.bootstrap(document, ['rfs']);
            });

            return container[0];
            //return null;
        },
        onRemove: function () {}
    });
}(this.document, this.L, this.angular));
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
/*jslint evil: true */
/*jslint nomen: true*/
(function (angular, L, console) {
    "use strict";
    angular.module('rfs.directives', []).directive('leafletSearch', ['$http', '$rootScope', '$q', '$timeout', 'kfticket', '$sce',
        function ($http, $rootScope, $q, $timeout, kfticket, $sce) {
            return {
                restrict: "E",
                templateUrl: 'templates/search.html',
                scope: {
                    widget: '='
                },
                controller: ['$scope',
                    function ($scope) {
                        var overlay = L.featureGroup().addTo($rootScope.map),
                            url = 'http://dawa.aws.dk/vejnavne/autocomplete?',
                            search = function () {
                                if ($scope.search.vejnavn && $scope.search.input.slice(0, $scope.search.vejnavn.length) === $scope.search.vejnavn) {
                                    url = 'http://dawa.aws.dk/adresser/autocomplete?';
                                    if ($scope.widget.options) {
                                        url += $scope.widget.options + '&';
                                    }
                                    url += 'vejnavn=' + $scope.search.vejnavn + '&q=';
                                } else {
                                    url = 'http://dawa.aws.dk/vejnavne/autocomplete?';
                                    if ($scope.widget.options) {
                                        url += $scope.widget.options + '&';
                                    }
                                    url += 'q=';
                                }
                                $http.jsonp(url + $scope.search.input + '&callback=JSON_CALLBACK')
                                    .then(function (res) {
                                        $scope.selected = null;
                                        if (res.data.length === 1 && $scope.search.lastKey !== 8 && $scope.search.lastKey !== 46) {
                                            $scope.search.isopen = false;
                                            var item = res.data[0];
                                            if (item.vejnavn) {
                                                $scope.search.vejnavn = item.tekst;
                                                $scope.selectAddr({
                                                    name: item.tekst,
                                                    type: "vejnavn"
                                                });
                                            } else if (item.adresse) {
                                                $scope.selectAddr({
                                                    name: item.tekst,
                                                    type: "adresse",
                                                    id: item.adresse.id
                                                });
                                            }

                                        } else {
                                            $scope.search.result = [];
                                            angular.forEach(res.data, function (item) {
                                                if (item.vejnavn) {
                                                    $scope.search.result.push({
                                                        name: item.tekst,
                                                        type: "vejnavn"
                                                    });
                                                } else if (item.adresse) {
                                                    $scope.search.result.push({
                                                        name: item.tekst,
                                                        type: "adresse",
                                                        id: item.adresse.id
                                                    });
                                                }
                                            });
                                            $scope.search.isopen = res.data.length > 0;
                                        }
                                    });
                            };
                        $scope.search = {
                            isopen: false,
                            input: "",
                            result: []
                        };


                        if ($scope.widget.options) {
                            url += $scope.widget.options + '&';
                        }
                        url += 'q=';
                        $scope.keyup = function ($event) {
                            var i, item;
                            $scope.search.lastKey = $event.keyCode;
                            if ($event.keyCode === 40) {
                                //down
                                if ($scope.search.result.length > 0) {
                                    if ($scope.selected) {
                                        for (i = 0; i < $scope.search.result.length; i += 1) {
                                            item = $scope.search.result[i];
                                            if (item === $scope.selected) {
                                                if (i < $scope.search.result.length - 1) {
                                                    $scope.selected = $scope.search.result[i + 1];
                                                    $scope.search.input = $scope.selected.name;
                                                }
                                                break;
                                            }
                                        }
                                    } else {
                                        $scope.selected = $scope.search.result[0];
                                    }
                                }
                            } else if ($event.keyCode === 38) {
                                //up
                                if ($scope.search.result.length > 0) {
                                    if ($scope.selected) {

                                        for (i = 0; i < $scope.search.result.length; i += 1) {
                                            item = $scope.search.result[i];
                                            if (item === $scope.selected) {
                                                if (i > 0) {
                                                    $scope.selected = $scope.search.result[i - 1];
                                                    $scope.search.input = $scope.selected.name;
                                                }
                                                break;
                                            }
                                        }
                                    }
                                }
                            } else {
                                search();
                            }
                        };
                        $scope.keydown = function ($event) {
                            if ($event.keyCode === 13) {
                                $event.preventDefault();
                                $scope.selectAddr($scope.selected);
                                $scope.search.lastKey = $event.keyCode;
                            }
                        };

                        $scope.selectAddr = function (item) {
                            if (item.type === "vejnavn") {
                                $scope.search.input = item.name;
                                $scope.search.vejnavn = item.name;
                                search();

                            } else {
                                $http.jsonp('http://dawa.aws.dk/adresser/' + item.id + '?callback=JSON_CALLBACK')
                                    .then(function (res) {
                                        $scope.search.input = item.name;
                                        $scope.geo = res;
                                        overlay.clearLayers();

                                        overlay.addLayer(L.marker([res.data.adgangsadresse.adgangspunkt.koordinater[1], res.data.adgangsadresse.adgangspunkt.koordinater[0]]));


                                        $rootScope.map.setView([res.data.adgangsadresse.adgangspunkt.koordinater[1], res.data.adgangsadresse.adgangspunkt.koordinater[0]], $scope.widget.zoom || 14);

                                    });
                            }
                        };
                    }]
            };
        }]).directive('leafletNavbar', ['$http', '$rootScope', '$q', '$timeout', 'kfticket', '$sce',
        function ($http, $rootScope, $q, $timeout, kfticket, $sce) {
            return {
                restrict: "E",
                templateUrl: 'templates/navbar.html',
                controller: ['$scope',
                    function ($scope) {
                        $scope.showSidebar = function () {
                            $rootScope.hideSidebar = !$rootScope.hideSidebar;
                            $scope.isCollapsed = true;
                        };
                        $scope.isCollapsed = true;
                    }]
            };
        }]).directive('leafletSidebar', ['$http', '$rootScope', '$q', '$timeout', 'kfticket', '$sce',
        function ($http, $rootScope, $q, $timeout, kfticket, $sce) {
            return {
                restrict: "E",
                templateUrl: 'templates/sidebar.html',
                controller: ['$scope',
                    function ($scope) {
                        $scope.showSidebar = function () {
                            $rootScope.hideSidebar = !$rootScope.hideSidebar;
                        };
                        $rootScope.$on('configuration', function () {
                            console.log($rootScope.configuration);
                        });
                        $rootScope.$on('overlay', function (e, layer) {
                            if ($rootScope.configuration.database === layer.config.database) {
                                console.log(layer);
                                $scope.layer = layer.data;
                            }
                        });
                    }]
            };
        }]).directive('leafletLegend', ['$http', '$rootScope', '$q', '$timeout', 'kfticket', '$sce', 'tilestream',
        function ($http, $rootScope, $q, $timeout, kfticket, $sce, tilestream) {
            return {
                restrict: "E",
                templateUrl: 'templates/legend.html',
                controller: ['$scope', '$rootScope',
                    function ($scope, $rootScope) {
                        $scope.trustAsHtml = function (html) {
                            $sce.trustAsHtml(html);
                        };
                        $scope.isBaselayersCollapsed = false;
                        $scope.isOverlaysCollapsed = false;
                        $scope.oneAtATime = true;
                        $rootScope.overlays = [];
                        var createMap = function (epsg) {
                                if (epsg === "25832") {
                                    $scope.map.options.crs = new L.Proj.CRS.TMS('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs', [120000, 5900000, 1000000, 6500000], {
                                        resolutions: [1638.4, 819.2, 409.6, 204.8, 102.4, 51.2, 25.6, 12.8, 6.4, 3.2, 1.6, 0.8, 0.4, 0.2, 0.1, 0.05, 0.025, 0.0125, 0.00625]
                                    });
                                } else {
                                    $scope.map.options.crs = L.CRS.EPSG3857;
                                }
                            },
                            createLayer = function (value) {
                                var deferred = $q.defer();
                                $timeout(function () {
                                    var jsonTransformed = {},
                                        theme = {},
                                        i,
                                        style,
                                        fundet,
                                        item;
                                    if (value.options) {
                                        jsonTransformed = JSON.parse(value.options, function (key, value) {
                                            if (value && (typeof value === 'string') && value.indexOf("function") === 0) {
                                                var jsFunc = new Function('return ' + value)();
                                                return jsFunc;
                                            }
                                            return value;
                                        });
                                    }
                                    if (value.attribution) {
                                        jsonTransformed.attribution = value.attribution;
                                    }
                                    if (value.type === 'xyz' && value.url && value.url !== "") {
                                        if (value.ticket) {
                                            kfticket.getTicket().then(function (ticket) {
                                                jsonTransformed.ticket = ticket;
                                                value.leaflet = L.tileLayer(value.url, jsonTransformed);
                                                deferred.resolve(value);
                                            });
                                        } else {
                                            value.leaflet = L.tileLayer(value.url, jsonTransformed);
                                            deferred.resolve(value);
                                        }
                                    } else if (value.type === 'wms') {
                                        jsonTransformed = angular.extend(jsonTransformed, value.wms);
                                        if (value.ticket) {
                                            kfticket.getTicket().then(function (ticket) {
                                                jsonTransformed.ticket = ticket;
                                                value.leaflet = L.tileLayer.wms(value.url, jsonTransformed);
                                                deferred.resolve(value);
                                            });
                                        } else {
                                            value.leaflet = L.tileLayer(value.url, jsonTransformed);
                                            deferred.resolve(value);
                                        }
                                    } else if (value.type === 'geojson' || value.type === 'database' || value.type === 'straks' || value.type === 'indberetninger' || value.type === 'tracking' || value.type === 'opgaver') {

                                        if (value.styles) {
                                            for (i = 0; i < value.styles.length; i += 1) {
                                                style = value.styles[i];
                                                theme[style.id] = style;
                                            }
                                        }
                                        if (value.style) {
                                            jsonTransformed.style = JSON.parse(value.style, function (key, value) {
                                                if (value && (typeof value === 'string') && value.indexOf("function") !== -1) {
                                                    var jsFunc = new Function("theme", 'return ' + value)(theme);
                                                    return jsFunc;
                                                }
                                                return value;
                                            });
                                        }
                                        if (value.onEachFeature) {
                                            jsonTransformed.onEachFeature = JSON.parse(value.onEachFeature, function (key, value) {
                                                if (value && (typeof value === 'string') && value.indexOf("function") !== -1) {
                                                    var jsFunc = new Function('return ' + value)();
                                                    return jsFunc;
                                                }
                                                return value;
                                            });
                                        }
                                        if (value.pointToLayer) {
                                            jsonTransformed.pointToLayer = JSON.parse(value.pointToLayer, function (key, value) {
                                                if (value && (typeof value === 'string') && value.indexOf("function") !== -1) {
                                                    var jsFunc = new Function("theme", "L", 'return ' + value)(theme, L);
                                                    return jsFunc;
                                                }
                                                return value;
                                            });
                                        }
                                        if (value.type === 'database') {
                                            $http.get('http://geo.kosgis.dk/couchdb/db-' + value.database + '/_all_docs?include_docs=true').success(function (data, status, headers, config) {
                                                value.leaflet = L.geoJson(null, jsonTransformed);
                                                for (i = 0; i < data.rows.length; i += 1) {
                                                    var doc = data.rows[i].doc;
                                                    if (doc._id.substring(0, 7) !== "_design") {
                                                        value.leaflet.addData(doc);
                                                    }
                                                }
                                                deferred.resolve(value);
                                            }).error(function (data, status, headers, config) {
                                                deferred.reject(data);
                                            });
                                        } else if (value.type === 'opgaver') {
                                            value.leaflet = L.geoJson(null, jsonTransformed);
                                            for (i = 0; i < $rootScope.configuration.widgets.length; i += 1) {
                                                item = $rootScope.configuration.widgets[i];
                                                if (item.id === "opgaver") {
                                                    fundet = true;
                                                    break;
                                                }
                                            }
                                            if (fundet) {
                                                $http.get('http://geo.kosgis.dk/couchdb/db-' + item.database + '/_all_docs?include_docs=true').success(function (data, status, headers, config) {
                                                    for (i = 0; i < data.rows.length; i += 1) {
                                                        var doc = data.rows[i].doc;
                                                        if (doc._id.substring(0, 7) !== "_design") {
                                                            value.leaflet.addData(doc);
                                                        }
                                                    }
                                                    deferred.resolve(value);
                                                }).error(function (data, status, headers, config) {
                                                    deferred.reject(data);
                                                });
                                            } else {
                                                deferred.reject();
                                            }
                                        } else if (value.type === 'indberetninger') {
                                            $http.get('http://geo.kosgis.dk/couchdb/db-' + $rootScope.configuration.database + '/_all_docs?include_docs=true').success(function (data, status, headers, config) {
                                                value.leaflet = L.geoJson(null, jsonTransformed);
                                                for (i = 0; i < data.rows.length; i += 1) {
                                                    var doc = data.rows[i].doc;
                                                    if (doc._id.substring(0, 7) !== "_design") {
                                                        value.leaflet.addData(doc);
                                                    }
                                                }
                                                deferred.resolve(value);
                                            }).error(function (data, status, headers, config) {
                                                deferred.reject(data);
                                            });
                                        } else if (value.type === 'tracking') {
                                            value.leaflet = L.geoJson(null, jsonTransformed);
                                            for (i = 0; i < $rootScope.configuration.widgets.length; i += 1) {
                                                item = $rootScope.configuration.widgets[i];
                                                if (item.id === "tracking") {
                                                    fundet = true;
                                                    break;
                                                }
                                            }
                                            if (fundet) {
                                                $http.get('http://geo.kosgis.dk/couchdb/db-' + item.database + '/_all_docs?include_docs=true').success(function (data, status, headers, config) {
                                                    for (i = 0; i < data.rows.length; i += 1) {
                                                        var doc = data.rows[i].doc;
                                                        if (doc._id.substring(0, 7) !== "_design") {
                                                            value.leaflet.addData(doc);
                                                        }
                                                    }
                                                    deferred.resolve(value);
                                                }).error(function (data, status, headers, config) {
                                                    deferred.reject(data);
                                                });
                                            } else {
                                                deferred.reject();
                                            }
                                        } else if (value.type === 'geojson') {
                                            value.leaflet = L.geoJson(value.geojson, jsonTransformed);
                                            deferred.resolve(value);
                                        } else if (value.type === 'straks') {
                                            $http.get('/api/' + $rootScope.configuration.database + '/straks').success(function (data, status, headers, config) {
                                                if (data.hasOwnProperty(value.straks)) {
                                                    value.leaflet = L.geoJson(data[value.straks].geojson, jsonTransformed);
                                                    deferred.resolve(value);
                                                } else {
                                                    deferred.reject(data);
                                                }
                                            }).error(function (data, status, headers, config) {
                                                deferred.reject(data);
                                            });
                                        }
                                    } else if (value.type === 'mbtiles' && value.mbtile && value.bounds) {
                                        if (typeof (value.minZoom) !== 'undefined') {
                                            jsonTransformed.minZoom = value.minZoom;
                                        }
                                        if (typeof (value.maxZoom) !== 'undefined') {
                                            jsonTransformed.maxZoom = value.maxZoom;
                                        }
                                        value.leaflet = L.tileLayer(tilestream + value.mbtile + '/{z}/{x}/{y}.' + value.format, jsonTransformed);
                                        deferred.resolve(value);
                                    }
                                });
                                return deferred.promise;
                            },
                            selectedBaselayer,
                            selectedBaselayerLeaflet,
                            addLayer = function (layer) {
                                if (layer.selected) {
                                    if ($scope.map.hasLayer(layer.leaflet)) {
                                        $scope.map.removeLayer(layer.leaflet);
                                    }
                                    $scope.map.addLayer(layer.leaflet);
                                    if (layer.leaflet.setZIndex) {
                                        layer.leaflet.setZIndex(layer.index);
                                    }
                                }
                            },
                            removeOverlays = function () {
                                var i,
                                    overlay;
                                for (i = 0; i < $rootScope.overlays.length; i += 1) {
                                    overlay = $rootScope.overlays[i];
                                    if ($scope.map.hasLayer(overlay.leaflet)) {
                                        $scope.map.removeLayer(overlay.leaflet);
                                    }
                                }
                                $rootScope.overlays = [];
                                if ($scope.map.hasLayer($scope.crosshairLayer)) {
                                    $scope.map.removeLayer($scope.crosshairLayer);
                                }
                            },
                            createOverlays = function () {
                                var i, overlay;
                                for (i = 0; i < $rootScope.configuration.map.overlays.length; i += 1) {
                                    overlay = $rootScope.configuration.map.overlays[i];
                                    overlay.index = i + 1;
                                    $rootScope.overlays.push(overlay);
                                    createLayer(overlay).then(addLayer);
                                }
                                $scope.map.addLayer($scope.crosshairLayer);
                                if ($scope.crosshairLayer.setZIndex) {
                                    $scope.crosshairLayer.setZIndex(i + 1);
                                }
                            };

                        $scope.overlayChange = function (overlay) {
                            if ($scope.map.hasLayer(overlay.leaflet)) {
                                $scope.map.removeLayer(overlay.leaflet);
                            }
                            addLayer(overlay);
                        };
                        $scope.baselayerChange = function (layer) {
                            if (layer !== $scope.baselayer) {
                                createLayer(layer).then(function (layer) {
                                    var bounds = $scope.map.getBounds(),
                                        redoOverlays = layer.epsg !== $scope.baselayer.epsg;
                                    if ($scope.map.hasLayer($scope.baselayer.leaflet)) {
                                        $scope.map.removeLayer($scope.baselayer.leaflet);
                                    }
                                    if (redoOverlays) {
                                        removeOverlays();
                                        createMap(layer.epsg);
                                    }
                                    $scope.map.addLayer(layer.leaflet);
                                    if (layer.leaflet.setZIndex) {
                                        layer.leaflet.setZIndex(0);
                                    }
                                    $scope.baselayer = layer;
                                    if (redoOverlays) {
                                        $scope.map.fitBounds(bounds);
                                        createOverlays();
                                    }
                                });
                            }
                        };
                        $rootScope.overlays = [];
                        $scope.map = $rootScope.map;
                        $scope.crosshairLayer = L.layerGroup();
                        $scope.layer = L.geoJson();
                        $rootScope.$on('configuration', function () {
                            if ($scope.baselayer) {
                                if ($rootScope.stateParams.x && $rootScope.stateParams.y && $rootScope.stateParams.z) {
                                    $scope.map.setView([$rootScope.stateParams.y, $rootScope.stateParams.x], $rootScope.stateParams.z);
                                }
                            } else {
                                if (typeof $rootScope.configuration.isBaselayersCollapsed === 'undefined') {
                                    $scope.isBaselayersCollapsed = false;
                                } else {
                                    $scope.isBaselayersCollapsed = $rootScope.configuration.isBaselayersCollapsed;
                                }
                                if (typeof $rootScope.configuration.isOverlaysCollapsed === 'undefined') {
                                    $scope.isOverlaysCollapsed = false;
                                } else {
                                    $scope.isOverlaysCollapsed = $rootScope.configuration.isOverlaysCollapsed;
                                }
                                var i,
                                    baselayer;

                                for (i = 0; i < $rootScope.configuration.map.baselayers.length; i += 1) {
                                    baselayer = $rootScope.configuration.map.baselayers[i];
                                    if (baselayer.selected) {
                                        $scope.baselayer = baselayer;
                                        $scope.selectedBaselayer = i;
                                        break;
                                    }
                                }
                                if ($scope.baselayer) {
                                    createMap($scope.baselayer.epsg);
                                    createLayer($scope.baselayer).then(function (layer) {
                                        $scope.map.addLayer(layer.leaflet);
                                        if (layer.leaflet.setZIndex) {
                                            layer.leaflet.setZIndex(0);
                                        }
                                        if ($rootScope.stateParams.x && $rootScope.stateParams.y && $rootScope.stateParams.z) {
                                            $scope.map.setView([$rootScope.stateParams.y, $rootScope.stateParams.x], $rootScope.stateParams.z);
                                        } else {
                                            $scope.map.fitBounds(layer.bounds);
                                        }
                                        createOverlays();
                                    });
                                }
                            }

                        });
                    }]
            };
        }]);
}(this.angular, this.L, this.console));
(function (window, angular, console) {
    'use strict';
    angular.module('rfs.filters', [])

    .filter('objectpath', function () {
        return function (input, doc) {
            var path = input.split('/');
            var item = doc;
            for (var m = 1; m < path.length; m++) {
                var key = path[m];
                if (item.hasOwnProperty(key)) {
                    item = item[key];
                }
            }
            return item;
        };
    })

    .filter('bytes', function () {
        return function (bytes, precision) {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
            if (typeof precision === 'undefined') precision = 1;
            var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
                number = Math.floor(Math.log(bytes) / Math.log(1024));
            return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
        };
    });
})(this, this.angular, this.console);
(function (window, angular, URL) {
    'use strict';

    angular.module('rfs.services', [])

    .factory('kfticket', ['$q', '$http', '$rootScope', '$browser',
        function ($q, $http, $rootScope, $browser) {
            return {
                getTicket: function () {
                    var deferred = $q.defer();
                    var cookies = $browser.cookies();
                    if (cookies.kfticket) {
                        window.setTimeout(function () {
                            deferred.resolve(cookies.kfticket);
                        }, 0);
                    } else {
                        $http.get($rootScope.kfticket).
                        success(function (data, status, headers, config) {
                            cookies = $browser.cookies();
                            deferred.resolve(cookies.kfticket);
                        }).
                        error(function (data, status, headers, config) {
                            deferred.reject();
                        });
                    }
                    return deferred.promise;
                }
            };
        }
    ])

    .factory('tilestream', ['$location',
        function ($location) {
            if ($location.$$host === 'localhost') {
                return 'http://localhost:8888/v2/';
            }
            return 'http://{s}.' + $location.$$host + '/tilestream/v2/';
    }])

    .factory('jsonpInterceptor', ['$timeout', '$window',
        function ($timeout, $window) {
            return {
                'request': function (config) {
                    if (config.method === 'JSONP') {
                        var callbackId = angular.callbacks.counter.toString(36);
                        config.callbackName = 'angular_callbacks_' + callbackId;
                        config.url = config.url.replace('JSON_CALLBACK', config.callbackName);

                        $timeout(function () {
                            $window[config.callbackName] = angular.callbacks['_' + callbackId];
                        }, 0, false);
                    }

                    return config;
                },

                'response': function (response) {
                    var config = response.config;
                    if (config.method === 'JSONP') {
                        delete $window[config.callbackName]; // cleanup
                    }

                    return response;
                },

                'responseError': function (rejection) {
                    var config = rejection.config;
                    if (config.method === 'JSONP') {
                        delete $window[config.callbackName]; // cleanup
                    }

                    return rejection;
                }
            };
        }
    ]);

})(this, this.angular, this.URL);
angular.module('rfs').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/config.html',
    "<div class=sidebar-wrapper><div ui-view></div></div>"
  );


  $templateCache.put('templates/indberetning.html',
    ""
  );


  $templateCache.put('templates/indberetninger.html',
    "<div class=\"panel panel-default\"><div class=panel-heading><button type=button class=\"btn btn-xs btn-default pull-right\" ng-click=showSidebar()><i class=\"fa fa-chevron-left\"></i></button><h3 class=panel-title>Indberetninger</h3></div><div class=panel-body><p><div class=row><div class=\"col-xs-8 col-md-8\"><input class=\"form-control search\" placeholder=\"Filter\"></div><div class=\"col-xs-4 col-md-4\"><button type=button class=\"btn btn-primary pull-right sort\" data-sort=feature-name id=sort-btn><i class=\"fa fa-sort\"></i>&nbsp;&nbsp;Sort</button></div></div></p></div><div class=\"list-group sidebar-table\"><a ui-sref=map.indberetning({indberetning:value.feature._id}) class=list-group-item ng-repeat=\"(key,value) in layer._layers\"><div ng-repeat=\"field in configuration.list\">{{field|objectpath:value.feature}}</div></a></div></div>"
  );


  $templateCache.put('templates/legend.html',
    "<div ng-class=\"{'panel panel-default':isLayersOpen, 'leaflet-control-layers leaflet-control':!isLayersOpen}\"><div ng-class=\"{'panel-heading':isLayersOpen, 'legend-collapse':!isLayersOpen}\"><h3 class=panel-title><a ng-click=\"isLayersOpen=!isLayersOpen\"><i class=\"fa fa-globe\" ng-class=\"{'legend-collapse':!isLayersOpen}\"></i> <span ng-show=isLayersOpen>Lagkontrol</span></a></h3></div><div class=list-group collapse=!isLayersOpen><div class=list-group-item><div class=form-group><h4 class=panel-title><i class=fa ng-class=\"{'fa-chevron-circle-up': !isBaselayersCollapsed, 'fa-chevron-circle-down': isBaselayersCollapsed}\" ng-click=\"isBaselayersCollapsed=!isBaselayersCollapsed\"></i> Baggrundskort</h4></div><div collapse=isBaselayersCollapsed><div class=radio ng-repeat=\"baselayer in configuration.map.baselayers\" ng-init=\"baselayer.expand=true\"><div class=\"pull-right fa fa-question-circle legend-theme-expand\" ng-class=\"{'fa-rotate-90': !baselayer.expand}\" ng-click=\"baselayer.expand=!baselayer.expand\"></div><label><input type=radio name=baselayer value={{$index}} ng-model=selectedBaselayer ng-click=baselayerChange(baselayer)>{{baselayer.name}}</label><div collapse=baselayer.expand class=\"alert alert-info\"><i class=\"fa fa-question-circle\"></i> <span ng-bind-html=baselayer.description></span></div></div></div></div><div class=list-group-item><div class=form-group><h4 class=panel-title><i class=fa ng-class=\"{'fa-chevron-circle-up': !isOverlaysCollapsed, 'fa-chevron-circle-down': isOverlaysCollapsed}\" ng-click=\"isOverlaysCollapsed=!isOverlaysCollapsed\"></i> Lag</h4></div><div collapse=isOverlaysCollapsed><div class=form-group ng-repeat=\"overlay in overlays\" ng-init=\"overlay.expand=true\"><div class=checkbox><div class=\"pull-right fa fa-question-circle legend-theme-expand\" ng-class=\"{'fa-rotate-90': !overlay.expand}\" ng-click=\"overlay.expand=!overlay.expand\"></div><label><input type=checkbox ng-model=overlay.selected ng-change=overlayChange(overlay)>{{overlay.name}}</label></div><div collapse=overlay.expand><table><tr ng-repeat=\"value in overlay.styles\" ng-init=\"x=(value.style.radius && value.style.weight)?(value.style.radius + value.style.weight):12\"><td style=text-align:center;padding-right:5px><svg ng-style=\"{'line-height':(value.style.radius && value.style.weight)?(value.style.radius + value.style.weight)*2+'px':'24px','height':(value.style.radius && value.style.weight)?(value.style.radius + value.style.weight)*2+'px':'24px','width':(value.style.radius && value.style.weight)?(value.style.radius + value.style.weight)*2+'px':'24px' }\"><circle ng-attr-cx={{x}} ng-attr-cy={{x}} ng-attr-r={{value.style.radius||10}} ng-attr-fill=\"{{value.style.fillColor||value.style.color||'#03f'}}\" ng-attr-fill-opacity={{value.style.fillOpacity||0.5}} ng-attr-stroke-opacity={{value.style.opacity||0.5}} ng-attr-stroke=\"{{value.style.color||'#03f'}}\" ng-attr-stroke-width=\"{{value.style.weight||2}}\"></svg></td><td>{{value.id}}</td></tr></table><div class=\"alert alert-info\"><i class=\"fa fa-question-circle\"></i> <span ng-bind-html=overlay.description></span></div></div></div></div></div></div></div>"
  );


  $templateCache.put('templates/navbar.html',
    "<div class=\"navbar navbar-inverse navbar-fixed-top\" role=navigation><div class=container><div class=navbar-header><button type=button class=navbar-toggle ng-click=\"isCollapsed = !isCollapsed\"><span class=icon-bar></span> <span class=icon-bar></span> <span class=icon-bar></span></button><div class=navbar-brand>{{configuration.name}}</div></div><div class=navbar-collapse collapse=isCollapsed><ul class=\"nav navbar-nav\" ng-if=sagsbehandler><li ng-class={active:!hideSidebar}><a ng-click=showSidebar()>Indberetninger</a></li></ul><div ng-repeat=\"widget in configuration.widgets\"><leaflet-search widget=widget ng-if=\"widget.id==='adressesøgning'\"></leaflet-search></div></div></div></div>"
  );


  $templateCache.put('templates/search.html',
    "<ul class=\"nav navbar-nav navbar-right\"><li class=dropdown dropdown is-open=search.isopen><form class=\"navbar-form navbar-right\" role=search><div class=\"form-group has-feedback\"><input id=searchbox placeholder={{widget.name}} class=form-control ng-model=search.input ng-keyup=keyup($event) ng-keydown=keydown($event)> <span class=\"glyphicon glyphicon-search form-control-feedback\"></span></div></form><ul id=searchlist class=dropdown-menu role=menu><li ng-repeat=\"s in search.result\" ng-class=\"{active: s==selected}\"><a href=# ng-click=selectAddr(s)>{{s.name}}</a></li></ul></li></ul>"
  );

}]);
