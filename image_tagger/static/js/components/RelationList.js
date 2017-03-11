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
    
    idToTag: function(id){
        if(!this.image || !this.image.blocks) return null;
        
        for (var i = 0; i < this.image.blocks.length; i++) {
            var block = this.image.blocks[i];
            if(block.id == id) return block;
        }
        return null;
    },
    
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
                var relationTag = this.idToTag(relation.originTagId);
                relationTag.relations.splice(relationTag.relations.indexOf(relation), 1);
                
                showLoadingOverlay(false);
            }.bind(this),
            function(){
                console.log("Ocorreu um erro ao deletar relação de id " + relation.id);
                showLoadingOverlay(false);
            }.bind(this)
        );
    }
    
};