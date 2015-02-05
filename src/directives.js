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