/* global angular */
var component = OverviewComponent = function($rootScope, $document){
    this.$document = $document;
    this.$rootScope = $rootScope;
}

component.definition = {
    controller: ['$rootScope', '$document', component],
    templateUrl: "static/js/components/overview.html",
    bindings: {
        blocks: '<',
        relations: '<',
        attributes: '<',
        image: '<'
    }
}

component.prototype = {
    
    $onChanges: function(changes){
        if(changes.image){
            if(changes.image.currentValue){
                this.multiplier = 390 / this.image.width;
            } else {
                this.multiplier = 1;
            }
        }
    },
    
    showBlock: function(block){
        block.visible = true;
    },
    
    showRelation: function(relation){
        this.showBlock(relation.blocks[0]);
        this.showBlock(relation.blocks[1]);
    },
    
    hideBlock: function(block){
        block.visible = false;
    },
    
    hideRelation: function(relation){
        this.hideBlock(relation.blocks[0]);
        this.hideBlock(relation.blocks[1]);
    },
    
};