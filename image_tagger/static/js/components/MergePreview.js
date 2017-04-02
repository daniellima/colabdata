/* global angular */
var component = MergePreviewComponent = function($rootScope, $http){
    this.$http = $http;
    this.$rootScope = $rootScope;
    
    this.open = false;
    
    this.errors = [];
    
    this.object = null;
    this.attributes = [];
    this.marker = null;
    
    this.tagIds = [];
    
    this.useOnthology = function() {
        return serverData.use_onthology;
    };
    
    this.image = function(){
        return store.getImage();
    }
    
    this.possibleObjectTypes = function(){
        return store.getObjectTypes();
    }
    
    this.possibleAttributeTypes = function(){
        return store.getAttributeTypes();
    }
    
    this.possibleValuesOfAttributeType = function(attributeTypeName){
        return store.getValuesForAttributeType(attributeTypeName);
    }
    
    $rootScope.$on('merge-preview-requested', function(event, data){
        var tags = data.tags;
        
        this.tagIds = [];
        for(var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            this.tagIds.push(tag.id);
        }
        
        this.object = this.mergeObjects(tags);
        this.marker = this.mergeMarkers(tags);
        this.attributes = this.mergeAttributes(tags);

        this.setOpen(true);
        this.callback = data.callback;
    }.bind(this));
};

component.definition = {
    controller: ['$rootScope', '$http', component],
    templateUrl: urls.template("mergePreview.html"),
    bindings: {}
};

component.prototype = {
    
    mergeObjects: function(tags) {
        var ocurrenceCount = {};
        var mostFrequentObject = null;
        var max = -Infinity;
        for(var i = 0; i < tags.length; i++) {
            var object = tags[i].object;
            ocurrenceCount[object] = ocurrenceCount[object] ? ocurrenceCount[object] + 1 : 1;
            if(ocurrenceCount[object] > max) {
                mostFrequentObject = object;
                max = ocurrenceCount[mostFrequentObject]
            }
        }
        return mostFrequentObject;
    },
    
    mergeMarkers: function(tags) {
        var x = 0;
        var y = 0;
        var width = 0;
        var height = 0;
        for(var i = 0; i < tags.length; i++) {
            var tag = tags[i];
            x += tag.x;
            y += tag.y;
            width += tag.width;
            height += tag.height;
        }
        x /= tags.length;
        y /= tags.length;
        width /= tags.length;
        height /= tags.length;
        return {x: x, y: y, width: width, height: height};
    },
    
    mergeAttributes: function(tags) {
        var mergedAttributes = [];
        for(var i = 0; i < tags.length; i++) {
            var attributes = tags[i].attributes; 
            for(var j = 0; j < attributes.length; j++) {
                var attribute = attributes[j];
                var alreadyMerged = false;
                for(var k = 0; k < mergedAttributes.length; k++) {
                    var mergedAttribute = mergedAttributes[k];
                    if(attribute.name == mergedAttribute.name && attribute.value == mergedAttribute.value) {
                        alreadyMerged = true;
                        break;
                    }
                }
                if(!alreadyMerged) {
                    mergedAttributes.push(attribute);
                }
            }
        }
        return mergedAttributes;
    },
    
    closeButtonClickHandler: function(){
        this.setOpen(false);
        
        this.callback();
    },
    
    checkValid: function() {
        this.errors = [];
        if(this.hasEmptyMarker()) {
            this.errors.push("Click on 'make tag' to define the tagged area.");
        }
        if(this.hasEmptyAttributes()) {
            this.errors.push("There is at least one empty attribute.");
        }
        if(this.hasRepeatedAttributes()) {
            this.errors.push("There is at least one attribute being repeated.");
        }
        
        return this.errors.length == 0;
    },
    
    hasEmptyAttributes: function() {
        for(var i = 0; i < this.attributes.length; i++) {
            var attribute = this.attributes[i];
            if(attribute.name == null || attribute.value == null || attribute.name.trim() == "" || attribute.value.trim() == "") {
                return true;
            }
        }
        
        return false;
    },
    
    hasEmptyMarker: function() {
        return this.marker == null;  
    },
    
    hasRepeatedAttributes: function() {
        for(var i = 0; i < this.attributes.length; i++) {
            var attribute1 = this.attributes[i];
            for(var j = 0; j < this.attributes.length; j++) {
                var attribute2 = this.attributes[j];
                if(attribute1 != attribute2 && attribute1.name == attribute2.name && attribute1.value == attribute2.value) {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    setOpen: function(value) {
        if(this.open == true && value == false){
            this.$rootScope.$emit('modal-closed');
        }
        if(this.open == false && value == true){
            this.$rootScope.$emit('modal-opened');
        }
        
        this.open = value;
    },
    
    editMarkerButtonClickHandler: function() {
        this.setOpen(false);
        
        this.$rootScope.$emit('new-marker-requested', {
            marker: this.marker,
            callback: function(newMarker) {
                if(newMarker != null) {// user canceled
                    this.marker = newMarker;
                }
                
                this.setOpen(true);
            }.bind(this)
        });
    },
    
    confirmMergeButtonClickHandler: function() {
        var isValid = this.checkValid();
        
        if(isValid) {
            showLoadingOverlay(true, "Merging...");
            
            store.mergeTags(this.$http, this.tagIds, this.object, this.attributes, this.marker)
            .then(function(response){
                this.setOpen(false);
                this.callback(true);
            }.bind(this), function(response){
                showAndLogErrorThatOcurredDuringAction("mesclar tags", response, this.$rootScope);
            }.bind(this))
            .finally(function() {
                showLoadingOverlay(false);
            });
        }
    },
    
    addAttributeButtonClickHandler: function(){
        this.attributes.push({'name': null, 'value': null});
    },
    removeAttributeButtonClickHandler: function(attribute){
        var attrs = this.attributes;
        attrs.splice(attrs.indexOf(attribute), 1);
    }
};