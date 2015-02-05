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
