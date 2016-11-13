/* global angular */
var component = RelationListComponent = function($http){
    this.$http = $http;
}

component.definition = {
    controller: ['$http', component],
    templateUrl: "static/js/components/relationList.html",
    bindings: {
        relations: '<',
        image: '<',
        
        onClose: '&',
        onRelationSelected: '&'
    }
}

component.prototype = {
    
    onRelationDeleted: function(event) {
        showLoadingOverlay(true, "Deletando...");
        
        this.$http({
            method: 'POST',
            url: 'image/delete/relation',
            data: {
                'id': event.relation.id
            }
        }).then(
            function(){
                this.relations.splice(this.relations.indexOf(event.relation), 1);
                
                showLoadingOverlay(false);
            }.bind(this),
            function(){
                console.log("Ocorreu um erro ao deletar relação de id " + event.relation.id);
                showLoadingOverlay(false);
            }.bind(this)
        );
    }
    
};