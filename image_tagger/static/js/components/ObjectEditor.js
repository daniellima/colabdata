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
    templateUrl: "static/js/components/objectEditor.html",
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
        
        if(this.tagBeingEdited == null) {
            this.tagBeingEdited = {
                id: null,
                object: "", 
                attributes: [],
                relations: [],
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            };
        }
        
        this.tagBeingEdited.object = this.object;
        this.tagBeingEdited.x = this.marker.x;
        this.tagBeingEdited.y = this.marker.y;
        this.tagBeingEdited.width = this.marker.width;
        this.tagBeingEdited.height = this.marker.height;
        this.tagBeingEdited.attributes = [];
        for(var i = 0; i < this.attributes.length; i++) {
            var attribute = this.attributes[i];
            this.tagBeingEdited.attributes.push({name: attribute.name, value: attribute.value, tag: this.tagBeingEdited});
        }
        
        store.saveTag(this.$http, this.tagBeingEdited).finally(function() {
            this.setOpen(false);
            
            this.modalCallback();
            
            showLoadingOverlay(false);
        }.bind(this));
    },
    deleteButtonClickHandler: function() {
        showLoadingOverlay(true, "Deletando...");
        
        store.deleteTag(this.$http, this.tagBeingEdited).finally(function(){
            this.setOpen(false);
            
            this.modalCallback();
            
            showLoadingOverlay(false);
        }.bind(this));
    },
    addAttributeButtonClickHandler: function(){
        this.attributes.push({'name': '', 'value': ''});
    },
    removeAttributeButtonClickHandler: function(attribute){
        var attrs = this.attributes;
        attrs.splice(attrs.indexOf(attribute), 1);
    }
};