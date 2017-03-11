/* global angular */
(function(){
var component = ImageTaggerComponent = function($rootScope, $http, $document){
    this.$http = $http;
    
    this.pages = {IMAGE: 1, OVERVIEW: 2}
    this.resizeMethods = { BY_WIDTH: 1, BY_HEIGHT: 2, ORIGINAL: 3 }
    
    this.currentPage = this.pages.IMAGE;
    this.overviewImageResizeMethod = this.resizeMethods.BY_WIDTH;
    this.imageResizeMethod = this.resizeMethods.BY_HEIGHT;
    
    this.dragging = false;
    this.initialX = 0;
    this.initialY = 0;
    this.markerX = 0;
    this.markerY = 0;
    this.markerWidth = 0;
    this.markerHeight = 0;
    this.markerVisible = false;
    
    this.image = null;
    this.blocks = [];
    
    this.showEdit = false;
    this.editedBlockImage = null;
    this.editedBlock = null;
    this.isEditingExistingBlock = false;
    
    this.showAllObjects = false;
    this.relationEditorIsVisible = false;
    this.selectedRelation = null;
    this.relationBlockSelected = undefined;
    
    this.objectViewerAction = "";
    
    this.isRelationListVisible = false;
    
    this.openedRelationEditorFromList = false;
    
    this.multiplier = function() {
        if(this.image == null) return null;
        
        var viewWidth = window.innerWidth - 50; // remove 50 pixels to avoid an eventual scrollbar
        var viewHeight = window.innerHeight - 98 - 50; // remove 98 pixels from navbar and scrollbar
        
        switch (this.imageResizeMethod) {
            case this.resizeMethods.BY_WIDTH:
                return viewWidth/this.image.width;
            case this.resizeMethods.BY_HEIGHT:
                return viewHeight/this.image.height;
            case this.resizeMethods.ORIGINAL:
                return 1;
        }
        
        return 1; // default
    };
    
    this.overviewMultiplier = function() {
        if(this.image == null) return null;
        
        var viewWidth = 390;
        var viewHeight = window.innerHeight - 98 - 50 - 26; // remove 98 pixels from navbar, scrollbar and overview title
        
        switch (this.overviewImageResizeMethod) {
            case this.resizeMethods.BY_WIDTH:
                return viewWidth/this.image.width;
            case this.resizeMethods.BY_HEIGHT:
                return viewHeight/this.image.height;
        }
        
        return 1; // default
    };
    
    $document.on('keypress', function(event){
        // Porque não funciona como o keyup e keydown?
        $rootScope.$apply(function(){
            this.addBox(event);
        }.bind(this));
    }.bind(this));
};

component.definition = {
    controller: ['$rootScope', '$http', '$document', component],
    templateUrl: "static/js/components/imageTagger.html",
    bindings: {
        image: '<',
        onClose: '&'
    }
}

component.actions = {
    EDIT: "Editar",
    SELECT: "Selecionar"
}

component.prototype = {
    $onChanges: function(changes){
        if(changes.image && changes.image.currentValue){
            this.imageResizeMethod = this.resizeMethods.BY_HEIGHT;
            store.imageChangeEvent(changes.image.currentValue);
            /* gambiarra para compatibilizar as diferenças de modelo entre o servidor e o cliente */
            if(this.image.blocks !== undefined && this.image.blocks.length) {
                this.blocks = this.image.blocks;
            } else {
                this.blocks = []
                for(var i = 0; i < this.image.tags.length; i++){
                    var tag = this.image.tags[i];
                    var block = {
                        'id': tag.id,
                        'x': tag.x,
                        'y': tag.y,
                        'width': tag.width,
                        'height': tag.height,
                        'relations': tag.relations
                    }
                    block.object = {'name': tag.object, 'attributes': tag.attributes}
                    this.blocks.push(block);
                }
                this.image.blocks = this.blocks;
                
                
            }
            /* fim da gambiarra */
            
            this.markerVisible = false;
            this.isEditingExistingBlock = false;
        }
    },
    
    idToTag: function(id){
        for (var i = 0; i < this.image.blocks.length; i++) {
            var block = this.image.blocks[i];
            if(block.id == id) return block;
        }
        return null;
    },
    
    removeRelationFromOriginBlock: function(relation){
        if(relation.originTagId === null) return null; // a relation é nova
        
        var relationTag = this.idToTag(relation.originTagId);
        relationTag.relations.splice(relationTag.relations.indexOf(relation), 1);
    },
    
    addRelationToOriginBlock: function(relation) {
        var relationBlock = this.idToTag(this.selectedRelation.originTagId);
        if(relationBlock.relations.indexOf(this.selectedRelation) === -1){
            relationBlock.relations.push(this.selectedRelation);
        }
    },
    
    showObjectEditor: function(block){
        this.showEdit = true;
        this.showAllObjects = false;
        this.editedBlockImage = this.image;
        this.editedBlock = block;
    },
    
    clickedPositionRelativeToImage: function(event){
        var rect = event.currentTarget.getBoundingClientRect();
        
        var pos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        
        // if the coordinates are negative, the user is dragging outside the image
        // it may happen because the mouse is inside the handler, which is inside the container-for-boxes,
        // where the mousemouve is registered
        var limitRight = rect.right - rect.left;
        var limitBottom = rect.bottom - rect.top;
        if(pos.x < 0) pos.x = 0;
        if(pos.x > limitRight) pos.x = limitRight;
        if(pos.y < 0) pos.y = 0;
        if(pos.y > limitBottom) pos.y = limitBottom;
        
        return pos;
    },
    
    addBox: function(event){
        if(event.keyCode !== 13) return;
        if(!this.markerVisible) return;
        event.preventDefault();
        
        var block = null;
        if(this.isEditingExistingBlock){
            this.editedBlock.x = this.markerX;
            this.editedBlock.y = this.markerY;
            this.editedBlock.width = this.markerWidth;
            this.editedBlock.height = this.markerHeight;
            
            if(this.editedBlock.id !== -1) {
                this.image.blocks.push(this.editedBlock);
            }
            
            block = this.editedBlock;
            
            this.isEditingExistingBlock = false;
        } else {
            block = {
                id: -1,
                x: this.markerX,
                y: this.markerY,
                width: this.markerWidth,
                height: this.markerHeight,
                object: {name: '', attributes: []}
            };
        }
        this.showObjectEditor(block);
        if(this.objectTagEditFromOverview){
            this.objectTagEditFromOverview = false;
            this.currentPage = this.pages.OVERVIEW;
        }
    },
    
    closeRelationEditor: function(){
        this.relationEditorIsVisible = false;
        this.selectedRelation = null;
        
        if(this.openedRelationEditorFromList){
            this.isRelationListVisible = true;
            this.openedRelationEditorFromList = false;
        }
    },
    
    showRelationEditor: function(relation){
        this.isRelationListVisible = false;
        this.selectedRelation = relation;
        this.originalRelation = {
            originTagId: relation.originTagId,
            targetTagId: relation.targetTagId,
            name: relation.name
        }
        this.relationEditorIsVisible = true;
    },
    
    // esse metodo e os outros Jsonable só quer ignorar o campo 'block' de um attribute,
    // que gera uma referencia ciclica caso se tente transformar o
    // block em um JSON diretamente.
    blockToJsonable: function(block){
        return {
            id: block.id,
            object: this.objectToJsonable(block.object),
            relations: block.relations,
            x: block.x,
            y: block.y,
            width: block.width,
            height: block.height,
        };
    },
    
    objectToJsonable: function(object){
        return {
            name: object.name,
            attributes: object.attributes.map(function(attribute){ return this.attributeToJsonable(attribute); }, this)
        };
    },
    
    attributeToJsonable: function(attribute){
        return {
            name: attribute.name,
            value: attribute.value,
        };
    },
    
    
    backButtonClickHandler: function() {
        this.onClose();
    },
    
    newRelationButtonClickHandler: function(){
        // não é redundante com o onBlockClicked?
        this.selectedRelation = {originTagId: null, targetTagId: null, name:""};
        this.relationEditorIsVisible = true;
    },
    
    newObjectButtonClickHandler: function(){
        this.markerX = 0;
        this.markerY = 0;
        this.markerWidth = 100;
        this.markerHeight = 100;
        this.markerVisible = true;
    },
    
    showObjectListButtonClickHandler: function(){
        this.showAllObjects = true;
        this.objectViewerAction = component.actions.EDIT;
    },
    
    showRelationListButtonClickHandler: function(){
        this.isRelationListVisible = true;
    },
    
    showOverviewButtonClickHandler: function() {
        this.currentPage = this.pages.OVERVIEW;
    },
    
    showImageButtonClickHandler: function() {
        this.currentPage = this.pages.IMAGE;
    },
    
    resizeImageButtonClickHandler: function(how) {
        this.imageResizeMethod = how;
    },
    
    resizeOverviewImageButtonClickHandler: function(resizeMethod) {
        this.overviewImageResizeMethod = resizeMethod;
    },
    
    
    overviewOnObjectClickHandler: function(block) {
        this.showObjectEditor(block);
    },
    
    overviewOnRelationClickHandler: function(relation) {
        this.showRelationEditor(relation);
    },
    
    
    tagContainerMousemoveHandler: function($event){
        if(this.dragging){
            // since the user drag the selection, show it
            this.markerVisible = true;
            
            var pos = this.clickedPositionRelativeToImage($event);
            this.markerX = Math.min(pos.x, this.initialX) / this.multiplier();
            this.markerY = Math.min(pos.y, this.initialY) / this.multiplier();
            this.markerWidth = Math.abs(pos.x - this.initialX) / this.multiplier();
            this.markerHeight = Math.abs(pos.y - this.initialY) / this.multiplier();
        }
    },
    
    tagContainerMousedownHandler: function($event){
        if($event.which !== 1) return;
        $event.preventDefault();
        
        this.dragging = true;
        
        var pos = this.clickedPositionRelativeToImage($event);
        this.initialX = pos.x;
        this.initialY = pos.y;
    },
    
    tagCornerMousedownHandler: function($event, corner){
        if($event.which !== 1) return;
        $event.stopPropagation();
        $event.preventDefault();
        
        this.dragging = true;

        if(corner === 'top-left'){
            this.initialX = this.markerX * this.multiplier() + this.markerWidth * this.multiplier();
            this.initialY = this.markerY * this.multiplier() + this.markerHeight * this.multiplier();
        }
        if(corner === 'top-right'){
            this.initialX = this.markerX * this.multiplier();
            this.initialY = this.markerY * this.multiplier() + this.markerHeight * this.multiplier();
        }
        if(corner === 'bottom-left'){
            this.initialX = this.markerX * this.multiplier() + this.markerWidth * this.multiplier();
            this.initialY = this.markerY * this.multiplier();
        }
        if(corner === 'bottom-right'){
            this.initialX = this.markerX * this.multiplier();
            this.initialY = this.markerY * this.multiplier();
        }
    },
    
    tagContainerMouseupHandler: function($event){
        this.dragging = false;
    },
    
    tagContainerMouseleaveHandler: function($event){
        this.dragging = false;
    },
    
    tagClickHandler: function($event, block){
        if($event.ctrlKey){
            if(this.selectedRelation === null){
                this.selectedRelation = {originTagId: null, targetTagId: null, name:""};
            }
            if(this.selectedRelation.originTagId === null){
                this.selectedRelation.originTagId = block.id;
            } else {
                this.selectedRelation.targetTagId = block.id;
                this.relationEditorIsVisible = true;
            }
        }
    },
    
    
    objectEditorOnSaveHandler: function(){
        showLoadingOverlay(true, "Salvando...");
        this.$http({
            method: 'POST',
            url: 'image/save/tag',
            data: {
                'imageId': this.editedBlockImage.id, 
                'tag': this.blockToJsonable(this.editedBlock)
            }
        })
        .then(function onTagSaved(response){
            if(this.editedBlock.id === -1){
                this.blocks.push(this.editedBlock);
                this.editedBlock.relations = [];
                this.editedBlock.id = response.data.id
            }
            this.markerVisible = false;
            this.showEdit = false;
            
            showLoadingOverlay(false);
        }.bind(this));
    },
    
    objectEditorOnEditHandler: function(){
        this.isEditingExistingBlock = true;
        this.markerVisible = true;
        this.markerX = this.editedBlock.x;
        this.markerY = this.editedBlock.y;
        this.markerWidth = this.editedBlock.width;
        this.markerHeight = this.editedBlock.height;
        
        if(this.editedBlock.id !== -1) {
            var index = this.image.blocks.indexOf(this.editedBlock);
            this.image.blocks.splice(index, 1);
        }
        
        this.showEdit = false;
        this.showAllObjects = false;
        
        // no caso de abrir da overview
        if(this.currentPage == this.pages.OVERVIEW) {
            this.objectTagEditFromOverview = true;
        }
        
        this.currentPage = this.pages.IMAGE;
    },
    
    objectEditorOnCloseHandler: function(){
        this.showEdit = false;
        
        if(this.objectViewerAction == component.actions.EDIT){
            this.showAllObjects = true;
        }
    },
    
    objectEditorOnBlockDeletedHandler: function() {
        this.showEdit = false;
        // remove all relations pointing to it
        for (var i = 0; i < this.blocks.length; i++) {
            var block = this.blocks[i];
            for (var j = 0; j < block.relations.length; j++) {
                var relation = block.relations[j];
                if(relation.targetTagId == this.editedBlock.id) {
                    block.relations.splice(block.relations.indexOf(relation), 1);
                }
            }
        }
    },
    
    
    objectViewerOnBlockSelectedHandler: function(block, action){
        if(action == component.actions.EDIT){
            this.showObjectEditor(block);
        }
        if(action == component.actions.SELECT){
            if(this.relationBlockSelected == 0){
                this.selectedRelation.originTagId = block.id;
            } else {
                this.selectedRelation.targetTagId = block.id;
            }
            
            this.showAllObjects = false;
            this.relationEditorIsVisible = true;
        }
    },
    
    objectViewerOnCloseHandler: function(){
        this.showAllObjects = false;
        
        if(this.objectViewerAction == component.actions.SELECT){
            this.relationEditorIsVisible = true;
        }
        
        this.objectViewerAction = "";
    },
    
    
    relationEditorOnCloseHandler: function(){
        if(this.originalRelation) {
            this.selectedRelation.name = this.originalRelation.name;
            this.selectedRelation.originTagId = this.originalRelation.originTagId;
            this.selectedRelation.targetTagId = this.originalRelation.targetTagId;
        }
        
        this.closeRelationEditor();
    },
    
    relationEditorOnSaveHandler: function(){
        showLoadingOverlay(true, "Salvando...");
        this.$http({
            method: 'POST',
            url: 'image/save/relation',
            data: {
                'id': this.selectedRelation.id || null,
                'originTagId': this.selectedRelation.originTagId, 
                'targetTagId': this.selectedRelation.targetTagId,
                'name': this.selectedRelation.name
            }
        })
        .then(function onRelationSaved(response){
            this.removeRelationFromOriginBlock(this.originalRelation);
            
            this.selectedRelation.id = response.data.id;
            
            this.addRelationToOriginBlock(this.selectedRelation);
            
            this.closeRelationEditor();
            
            showLoadingOverlay(false);
        }.bind(this));
    },
    
    relationEditorOnBlockSelectedHandler: function(index){
        this.relationEditorIsVisible = false;
        this.showAllObjects = true;
        this.objectViewerAction = component.actions.SELECT;
        this.relationBlockSelected = index;
    },
    
    
    relationListOnRelationSelectedHandler: function(relation){
        this.showRelationEditor(relation);
        
        this.openedRelationEditorFromList = true;
    },
    
    relationListOnCloseHandler: function(){
        this.isRelationListVisible = false;
    },
    
};
})();