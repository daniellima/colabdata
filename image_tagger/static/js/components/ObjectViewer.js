/* global angular */
var component = ObjectViewerComponent = function(){}

component.definition = {
    controller: component,
    templateUrl: "static/js/components/objectViewer.html",
    bindings: {
        blocks: '<',
        image: '<',
        action: '<',
        
        onClose: '&',
        onBlockSelected: '&'
    }
}

component.prototype = {
    
};