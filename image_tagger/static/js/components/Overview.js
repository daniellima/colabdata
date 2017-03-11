/* global angular */
var component = OverviewComponent = function(){}

component.definition = {
    controller: component,
    templateUrl: "static/js/components/overview.html",
    bindings: {
        blocks: '<',
        relations: '<',
        attributes: '<',
        image: '<',
        multiplier: '<',
        
        onObjectClick: '&',
        onRelationClick: '&'
    }
}

component.prototype = {
    
    $onChanges: function(changes){
        // if(changes.image){
        //     if(changes.image.currentValue){
        //         this.multiplier = 390 / this.image.width;
        //     } else {
        //         this.multiplier = 1;
        //     }
        // }
    },
    
    idToTag: function(id){
        if(!this.image || !this.image.blocks) return null;
        
        for (var i = 0; i < this.image.blocks.length; i++) {
            var block = this.image.blocks[i];
            if(block.id == id) return block;
        }
        return null;
    },
    
    showBlock: function(block){
        block.visible = true;
    },
    
    showRelation: function(relation){
        this.showBlock(this.idToTag(relation.originTagId));
        this.showBlock(this.idToTag(relation.targetTagId));
    },
    
    hideBlock: function(block){
        block.visible = false;
    },
    
    hideRelation: function(relation){
        this.hideBlock(this.idToTag(relation.originTagId));
        this.hideBlock(this.idToTag(relation.targetTagId));
    },
    
};