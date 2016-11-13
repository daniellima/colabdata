/* global angular */
var component = ObjectViewerComponent = function($http){
    this.$http = $http;
}

component.definition = {
    controller: ['$http', component],
    templateUrl: "static/js/components/objectViewer.html",
    bindings: {
        blocks: '<',
        image: '<',
        action: '<',
        
        onClose: '&',
        onBlockSelected: '&',
        
    }
}

component.prototype = {
    
    
    
};