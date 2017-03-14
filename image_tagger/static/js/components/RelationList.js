/* global angular */
var component = RelationListComponent = function($rootScope, $http){
    this.$http = $http;
    this.$rootScope = $rootScope;
    
    this.open = false;
    
    $rootScope.$on('relation-list-requested', function(event, data) {
        this.open = true;
        this.modalCallback = data.callback;
    }.bind(this));
    
    this.relations = function() {
        return store.getAllRelations();
    },
    
    this.image = function() {
        return store.getImage();
    }
}

component.definition = {
    controller: ['$rootScope', '$http', component],
    templateUrl: "static/js/components/relationList.html",
    bindings: {}
}

component.prototype = {
    
    closeButtonClickHandler: function() {
        this.open = false;
        
        this.modalCallback();
    },
    
    deleteRelationButtonClickHandler: function(relation) {
        showLoadingOverlay(true, "Deletando...");
        
        store.deleteRelation(this.$http, relation).then(function(){
            showLoadingOverlay(false);
        }.bind(this));
    },
    
    editRelationButtonClickHandler: function(relation) {
        this.open = false;
        
        this.$rootScope.$emit('relation-editor-requested', {
            relation: relation,
            callback: function() {
                this.open = true;
            }.bind(this)
        });
    }
    
};