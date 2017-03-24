/* global angular */
var component = ObjectEditorComponent = function($rootScope, $http){
    this.$http = $http;
    this.$rootScope = $rootScope;
    
    this.open = false;
    this.tagBeingEdited = null;
    this.object = "";
    this.attributes = [];
    this.marker = {x:0, y:0, width:0, height:0}
    
    this.image = function(){
        return store.getImage();
    }
    
    this.canSaveTag = function(){
        
        for(var i = 0; i < this.attributes.length; i++) {
            var attribute = this.attributes[i];
            if(attribute.name.trim() == "" || attribute.value.trim() == "") {
                return false;
            }
        }
        
        return true;
    }
    
    var _attributeTypeNames = []
    this.possibleAttributeTypeNames = function(){
        _attributeTypeNames.splice(0, _attributeTypeNames.length)
        
        var types = store.getAttributeTypes();
        for(var i = 0; i < types.length; i++) {
            var type = types[i];
            _attributeTypeNames.push(type.name);
        }
        
        return _attributeTypeNames;
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
            
            this.object = "";
            this.attributes = [];
            this.marker = {x:data.marker.x, y:data.marker.y, width:data.marker.width, height:data.marker.height};
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
                this.marker = newMarker;
                
                this.setOpen(true);
            }.bind(this)
        });
    },
    saveButtonClickHandler: function() {
        showLoadingOverlay(true, "Salvando...");
        
        store.saveTag(this.$http, this.tagBeingEdited, this.object, this.attributes, this.marker)
        .then(function() {
            this.setOpen(false);
            
            this.modalCallback();
        }.bind(this), function(response) { 
            showAndLogErrorThatOcurredDuringAction("salvar o objeto", response, this.$rootScope);
        }.bind(this))
        .finally(function() {
            showLoadingOverlay(false);
        }.bind(this));
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
        this.attributes.push({'name': '', 'value': ''});
    },
    removeAttributeButtonClickHandler: function(attribute){
        var attrs = this.attributes;
        attrs.splice(attrs.indexOf(attribute), 1);
    }
};