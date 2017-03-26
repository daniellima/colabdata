/* global angular */
var component = ObjectEditorComponent = function($rootScope, $http){
    this.$http = $http;
    this.$rootScope = $rootScope;
    
    this.open = false;
    
    this.errors = [];
    
    this.tagBeingEdited = null;
    this.object = null;
    this.attributes = [];
    this.marker = null;
    
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
    
    $rootScope.$on('tag-editor-requested', function(event, data){
        if(data.tag) {
            this.tagBeingEdited = data.tag;
            
            this.object = data.tag.object;
            this.marker = {x:data.tag.x, y:data.tag.y, width:data.tag.width, height:data.tag.height}
            
            this.attributes = [];
            for(var i = 0; i < data.tag.attributes.length; i++) {
                var attribute = data.tag.attributes[i];
                this.attributes.push({name: attribute.name, value: attribute.value});
            }
        } else {
            this.tagBeingEdited = null;
            
            this.object = null;
            this.attributes = [];
            if(data.marker) {
                this.marker = {x:data.marker.x, y:data.marker.y, width:data.marker.width, height:data.marker.height};
            } else {
                this.marker = null;
            }
        }
        
        this.setOpen(true);
        this.modalCallback = data.callback;
    }.bind(this));
};

component.definition = {
    controller: ['$rootScope', '$http', component],
    templateUrl: urls.template("objectEditor.html"),
    bindings: {}
};

component.prototype = {
    
    closeButtonClickHandler: function(){
        this.setOpen(false);
        
        this.modalCallback();
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
    
    saveButtonClickHandler: function() {
        var isValid = this.checkValid();
        
        if(isValid) {
            showLoadingOverlay(true, "Salvando...");
            var object = this.object === null ? "" : this.object;
            store.saveTag(this.$http, this.tagBeingEdited, object, this.attributes, this.marker)
            .then(function() {
                this.setOpen(false);
                
                this.modalCallback();
            }.bind(this), function(response) { 
                showAndLogErrorThatOcurredDuringAction("salvar o objeto", response, this.$rootScope);
            }.bind(this))
            .finally(function() {
                showLoadingOverlay(false);
            }.bind(this));
        }
    },
    deleteButtonClickHandler: function() {
        showLoadingOverlay(true, "Deletando...");
        
        store.deleteTag(this.$http, this.tagBeingEdited)
        .then(function(){
            this.setOpen(false);
            
            this.modalCallback();
        }.bind(this), function(response){
            showAndLogErrorThatOcurredDuringAction("deletar o objeto", response, this.$rootScope);
        }.bind(this))
        .finally(function(response) {
            showLoadingOverlay(false);
        });
    },
    
    addAttributeButtonClickHandler: function(){
        this.attributes.push({'name': null, 'value': null});
    },
    removeAttributeButtonClickHandler: function(attribute){
        var attrs = this.attributes;
        attrs.splice(attrs.indexOf(attribute), 1);
    }
};