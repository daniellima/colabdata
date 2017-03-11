var component = RelationEditorComponent = function(){
    this.image = function() {
        return store.getImage();
    }
};

component.definition = {
    controller: component,
    templateUrl: 'static/js/components/relationEditor.html',
    bindings: {
        relation: '<',
        
        onClose: '&',
        onSave: '&',
        onBlockSelected: '&'
    }
},

component.prototype = {

    $onChanges: function(changes){},
    
    isBlocksChoosen: function(){
        if(!this.relation) return false;
        
        return this.relation.originTag && this.relation.targetTag;
    },
    
    isRelationComplete: function(){
        if(!this.relation) return false;
        
        return this.relation.originTag && this.relation.targetTag && this.relation.name !== "";
    },
};