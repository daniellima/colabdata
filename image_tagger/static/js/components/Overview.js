/* global angular */
var component = OverviewComponent = function(){
    /* TODO deveria ser uma computed property */
    this.visibleTags = [];
    
    this.attributes = function(){
        return store.getAllAttributes();
    },
    
    this.relations = function() {
        return store.getAllRelations();
    },
    
    this.image = function() {
        return store.getImage();
    }
    
}

component.definition = {
    controller: component,
    templateUrl: "static/js/components/overview.html",
    bindings: {
        // TODO receber via eventos
        multiplier: '<',
        
        onObjectClick: '&',
        onRelationClick: '&'
    }
}

component.prototype = {
    
    $onChanges: function(changes){},
    // TODO criar handlers
    showTag: function(tag){
        this.visibleTags.push(tag);
    },
    
    showRelation: function(relation){
        this.showTag(relation.originTag);
        this.showTag(relation.targetTag);
    },
    
    hideTag: function(tag){
        this.visibleTags.splice(this.visibleTags.indexOf(tag), 1);
    },
    
    hideRelation: function(relation){
        this.hideTag(relation.originTag);
        this.hideTag(relation.targetTag);
    },
    
};