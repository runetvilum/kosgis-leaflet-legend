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