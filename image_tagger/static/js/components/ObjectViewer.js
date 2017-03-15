/* global angular */
var component = ObjectViewerComponent = function($rootScope, $http){
    this.$rootScope = $rootScope;
    this.$http = $http;
    
    this.open = false;
    
    $rootScope.$on('tag-requested', function(event, data) {
        this.setOpen(true);
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
        
        this.setOpen(false);
    },
    
    setOpen: function(value) {
        if(this.open == true && value == false){
            this.$rootScope.$emit('modal-closed');
        }
        if(this.open == false && value == true){
            this.$rootScope.$emit('modal-opened');
        }
        
        this.open = value;
    },
    
    tagThumbnailButtonClickHandler: function(tag){
        this.setOpen(false);
        
        if(this.action == "Editar") {
            this.$rootScope.$emit('tag-editor-requested', {
                tag: tag,
                callback: function() {
                    this.setOpen(true);
                }.bind(this)
            });
        } else {
            this.tagSelectedCallback(tag);
        }
    }
    
};