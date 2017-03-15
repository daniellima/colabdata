/* global angular */
var component = ObjectViewerComponent = function($rootScope, $http){
    this.$rootScope = $rootScope;
    this.$http = $http;
    
    this.open = false;
    
    $rootScope.$on('tag-requested', function(event, data) {
        this.open = true;
        this.action = data.action;
        
        this.tagSelectedCallback = data.callback;
    }.bind(this));
    
    this.image = function() {
        return store.getImage();
    }
}

component.definition = {
    controller: ['$rootScope', '$http', component],
    templateUrl: "static/js/components/objectViewer.html",
    bindings: {}
}

component.prototype = {
    
    closeButtonClickHandler: function() {
        this.tagSelectedCallback();
        
        this.open = false;
    },
    
    tagThumbnailButtonClickHandler: function(tag){
        if(this.action == "Editar") {
            this.$rootScope.$emit('tag-editor-requested', {
                tag: tag,
                callback: function() {
                    this.open = true;
                }.bind(this)
            });
        } else {
            this.tagSelectedCallback(tag);
        }
        
        this.open = false;
    }
    
};