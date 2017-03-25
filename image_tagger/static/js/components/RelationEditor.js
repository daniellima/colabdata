var component = RelationEditorComponent = function($http, $rootScope){
    this.$http = $http;
    this.$rootScope = $rootScope;

    this.open = false;
    
    this.relationBeingEdited = null;
    this.originTag = null;
    this.targetTag = null;
    this.name = null;
    
    this.useOnthology = function() {
        return serverData.use_onthology;
    };
    
    this.possibleRelationTypes = function(){
        return store.getRelationTypes();
    }
    
    $rootScope.$on('relation-editor-requested', function(event, data) {
        this.setOpen(true);
        
        if(!data.relation) {
            this.relationBeingEdited = null;
            this.originTag = null;
            this.targetTag = null;
            this.name = null;
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
    templateUrl: urls.template('relationEditor.html'),
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
        return this.originTag && this.targetTag && this.name !== null && this.name !== "";
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
        showLoadingOverlay(true, "Salvando...");
        store.saveRelation(this.$http, this.relationBeingEdited, this.name, this.originTag, this.targetTag)
        .then(function(){
            
            this.modalCallback();
            
            this.setOpen(false);
        }.bind(this), function(response) {
            showAndLogErrorThatOcurredDuringAction("salvar a relação", response, this.$rootScope);
        }.bind(this))
        .finally(function(){
            showLoadingOverlay(false);
        });
    }
};