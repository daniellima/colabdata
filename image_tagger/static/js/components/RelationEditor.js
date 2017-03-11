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
    
    idToTag: function(id){
        if(!this.image || !this.image.blocks) return null;
        
        for (var i = 0; i < this.image.blocks.length; i++) {
            var block = this.image.blocks[i];
            if(block.id == id) return block;
        }
        return null;
    },
    
    IsBlocksChoosen: function(){
        if(!this.relation) return false;
        
        return this.relation.originTagId && this.relation.targetTagId;
    },
    
    isRelationComplete: function(){
        if(!this.relation) return false;
        
        return this.relation.originTagId && this.relation.targetTagId && this.relation.name !== "";
    },
};