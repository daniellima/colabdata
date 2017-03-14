/* global angular */
var component = ObjectViewerComponent = function($rootScope, $http){
    this.$http = $http;
    
    this.open = false;
    
    $rootScope.$on('tag-requested', function(event, data) {
        this.open = true;
        this.action = data.action;
        
        this.blockSelectedCallback = data.callback;
    }.bind(this));
}

component.definition = {
    controller: ['$rootScope', '$http', component],
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
    
    tagThumbnailButtonClickHandler: function(block){
        this.blockSelectedCallback(block);
        
        this.open = false;
        
        //this.onBlockSelected({block: block, action: this.action});
    }
    
};