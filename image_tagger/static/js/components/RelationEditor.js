var component = RelationEditorComponent = function(){};

component.definition = {
    controller: component,
    templateUrl: 'static/js/components/relationEditor.html',
    bindings: {
        image: '<',
        relation: '<',
        
        onClose: '&',
        onSave: '&',
        onBlockSelected: '&'
    }
},

component.prototype = {

    $onChanges: function(changes){
        
    },
    
    
    IsBlocksChoosen: function(){
        if(!this.relation) return false;
        
        return this.relation.blocks[0] && this.relation.blocks[1];
    },
    
    isRelationComplete: function(){
        if(!this.relation) return false;
        
        return this.relation.blocks[0] && this.relation.blocks[1] && this.relation.name !== "";
    }
};