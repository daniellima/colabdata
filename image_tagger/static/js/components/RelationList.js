/* global angular */
var component = RelationListComponent = function(){}

component.definition = {
    controller: component,
    templateUrl: "static/js/components/relationList.html",
    bindings: {
        relations: '<',
        image: '<',
        
        onClose: '&',
        onRelationSelected: '&'
    }
}

component.prototype = {
    
};