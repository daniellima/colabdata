/* global angular */
var component = RelationListComponent = function($rootScope, $http){
    this.$http = $http;
    this.$rootScope = $rootScope;
    
    this.open = false;
    
    $rootScope.$on('relation-list-requested', function(event, data) {
        this.setOpen(true);
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
        this.setOpen(false);
        
        this.modalCallback();
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
    
    deleteRelationButtonClickHandler: function(relation) {
        showLoadingOverlay(true, "Deletando...");
        
        store.deleteRelation(this.$http, relation).then(function(){}.bind(this),
        function(response) {
            showAndLogErrorThatOcurredDuringAction("deletar a relação", response, this.$rootScope);
        }.bind(this))
        .finally(function() {
            showLoadingOverlay(false);
        });
    },
    
    editRelationButtonClickHandler: function(relation) {
        this.setOpen(false);
        
        this.$rootScope.$emit('relation-editor-requested', {
            relation: relation,
            callback: function() {
                this.setOpen(true);
            }.bind(this)
        });
    }
    
};