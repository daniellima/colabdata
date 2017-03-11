/* global angular */
var component = RelationListComponent = function($http){
    this.$http = $http;
    
    this.relations = function() {
        return store.getAllRelations();
    },
    
    this.image = function() {
        return store.getImage();
    }
}

component.definition = {
    controller: ['$http', component],
    templateUrl: "static/js/components/relationList.html",
    bindings: {
        onClose: '&',
        onRelationSelected: '&'
    }
}

component.prototype = {
    
    onRelationDeleted: function(relation) {
        showLoadingOverlay(true, "Deletando...");
        
        this.$http({
            method: 'POST',
            url: 'image/delete/relation',
            data: {
                'id': relation.id
            }
        }).then(
            function(){
                store.relationDeletedEvent(relation);
                
                showLoadingOverlay(false);
            }.bind(this),
            function(){
                console.log("Ocorreu um erro ao deletar relação de id " + relation.id);
                showLoadingOverlay(false);
            }.bind(this)
        );
    }
    
};