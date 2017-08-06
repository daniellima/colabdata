/* global angular */
var component = OverviewComponent = function($rootScope){
    this.$rootScope = $rootScope;
    
    /* TODO deveria ser uma computed property */
    this.visibleTags = [];
    
    this._tagsWithAttributes = [];
    this.tagsWithAttributes = function() {
        this._tagsWithAttributes.splice(0, this._tagsWithAttributes.length);
        
        for(var i = 0; i < store.getImage().tags.length; i++) {
            var tag = store.getImage().tags[i];
            if(tag.attributes.length > 0) {
                this._tagsWithAttributes.push(tag);
            }
        }

        return this._tagsWithAttributes;
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
    templateUrl: urls.template("overview.html"),
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
        if(relation.originTag == relation.targetTag) {
            this.showTag(relation.originTag);
        }
        else {
            this.showTag(relation.originTag);
            this.showTag(relation.targetTag);
        }
    },
    
    hideTag: function(tag){
        this.visibleTags.splice(this.visibleTags.indexOf(tag), 1);
    },
    
    hideRelation: function(relation){
        if(relation.originTag == relation.targetTag) {
            this.hideTag(relation.originTag);
        }
        else {
            this.hideTag(relation.originTag);
            this.hideTag(relation.targetTag);
        }
    }
};