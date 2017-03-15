/* global angular */
var component = OverviewComponent = function($rootScope){
    this.$rootScope = $rootScope;
    
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
    controller: ['$rootScope', component],
    templateUrl: "static/js/components/overview.html",
    bindings: {
        // TODO receber via eventos
        multiplier: '<',
    }
}

component.prototype = {
    
    $onChanges: function(changes){},
    // TODO criar handlers
    showTag: function(tag){
        this.visibleTags.push(tag);
    },
    tagItemClickHandler: function(tag){
        this.$rootScope.$emit('tag-editor-requested', {
            tag: tag,
            callback: function(){}.bind(this)
        });
    },
    attributeItemClickHandler: function(tag){
        this.$rootScope.$emit('tag-editor-requested', {
            tag: tag,
            callback: function(){}.bind(this)
        });
    },
    relationItemClickHandler: function(relation){
        this.$rootScope.$emit('relation-editor-requested', {
            relation: relation,
            callback: function() {}.bind(this)
        });
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