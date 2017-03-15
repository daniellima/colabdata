var component = RelationEditorComponent = function($http, $rootScope){
    this.$http = $http;
    this.$rootScope = $rootScope;

    this.open = false;
    
    this.relationBeingEdited = null;
    this.originTag = null;
    this.targetTag = null;
    this.name = null;
    
    $rootScope.$on('relation-editor-requested', function(event, data) {
        this.setOpen(true);
        
        if(!data.relation) {
            this.relationBeingEdited = null;
            this.originTag = null;
            this.targetTag = null;
            this.name = "";
        } else {
            this.relationBeingEdited = data.relation;
            this.originTag = data.relation.originTag;
            this.targetTag = data.relation.targetTag;
            this.name = data.relation.name;
        }
        
        this.modalCallback = data.callback;
    }.bind(this));
    
    this.image = function() {
        return store.getImage();
    }
};

component.definition = {
    controller: ['$http', '$rootScope', component],
    templateUrl: 'static/js/components/relationEditor.html',
    bindings: {}
},

component.prototype = {

    $onChanges: function(changes){},
    
    setOpen: function(value) {
        if(this.open == true && value == false){
            this.$rootScope.$emit('modal-closed');
        }
        if(this.open == false && value == true){
            this.$rootScope.$emit('modal-opened');
        }
        
        this.open = value;
    },
    
    isBlocksChoosen: function(){
        return this.originTag && this.targetTag;
    },
    
    isRelationComplete: function(){
        return this.originTag && this.targetTag && this.name !== "";
    },
    
    tagThumbnailButtonClickHandler: function(whichTag) {
        
        this.setOpen(false);
        
        this.$rootScope.$emit('tag-requested', {
            action: 'Selecionar',
            callback: function(tag){
                this.setOpen(true);
                
                if(whichTag == 'origin') {
                    this.originTag = tag;
                } else {
                    this.targetTag = tag;
                }
            }.bind(this)
        });
        
    },
    
    closeButtonClickHandler: function() {
        this.setOpen(false);
        
        this.modalCallback();
    },
    
    saveButtonClickHandler: function() {
        
        if(this.relationBeingEdited === null) {
            this.relationBeingEdited = {
                id: null,
                name: "",
                originTag: null,
                targetTag: null
            };
        }
        
        this.relationBeingEdited.name = this.name;
        this.relationBeingEdited.originTag = this.originTag;
        this.relationBeingEdited.targetTag = this.targetTag;
        
        showLoadingOverlay(true, "Salvando...");
        store.saveRelation(this.$http, this.relationBeingEdited)
        .then(function(){
            
            this.modalCallback(this.relationBeingEdited);
            
            this.setOpen(false);
            
            showLoadingOverlay(false);
        }.bind(this));
    }
};