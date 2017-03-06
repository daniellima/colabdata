/* global angular */
var component = ImageTaggerComponent = function($rootScope, $http, $document){
    this.$http = $http;
    
    this.initialX = 0;
    this.initialY = 0;
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.dragging = false;
    this.show = false;
    this.handle = null;
    
    this.image = null;
    this.multiplier = 1;
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
    this.relations = [];
    
    this.overviewVisible = false;
    this.attributes = [];
    
    this.ctrlPressed = false;
    
    this.openedRelationEditorFromList = false;
    
    $document.on('keypress', function(event){
        $rootScope.$apply(function(){
            this.addBox(event);
        }.bind(this));
    }.bind(this));
    
    $document.on('keydown', function(event){
        if(event.keyCode == 17){
            this.ctrlPressed = true;
        }
    }.bind(this))
    
    $document.on('keyup', function(event){
        if(event.keyCode == 17){
            this.ctrlPressed = false;
        }
    }.bind(this))
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
    edit: "Editar",
    select: "Escolher"
}

component.prototype = {
    $onChanges: function(changes){
        if(changes.image && changes.image.currentValue){
            this.resizeImage('byHeight');
            
            /* gambiarra para compatibilizar as diferenças de modelo entre o servidor e o cliente */
            console.log(this.image)
            console.log(this.image.blocks)
            console.log(this.blocks)
            
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
            
            this.relations = this.getRelations();
            this.show = false;
            this.isEditingExistingBlock = false;
            this.refreshAttributes();
            this.resizeOverviewImage('byWidth');
        }
    },
    
    getRelations: function(){
        var relations = []
        for (var i = this.blocks.length; i--; ) {
            var block = this.blocks[i];
            var dryRelations = block.relations;
            for (var j = dryRelations.length; j--; ) {
                relations.push(this.hidrateRelation(dryRelations[j]));
            }
        }
        return relations;
    },
    
    hidrateRelation: function(dryRelation){
        return {
            'id': dryRelation.id,
            'name': dryRelation.name,
            'blocks': [this.getBlockFromId(dryRelation.originTagId), this.getBlockFromId(dryRelation.targetTagId)]
        }
    },
    
    getBlockFromId: function(id){
        for (var i = this.image.blocks.length; i--; ) {
            var block = this.image.blocks[i];
            if(block.id == id) return block;
        }
        throw "Block not found";
    },
    
    onBlockDeleted: function() {
        this.showEdit = false;
        this.refreshAttributes();
        for (var i = this.relations.length-1; i >= 0; i--) {
            var relation = this.relations[i];
            if(relation.blocks[0].id == this.editedBlock.id || relation.blocks[1].id == this.editedBlock.id) {
                this.relations.splice(this.relations.indexOf(relation), 1);
            }
        }
    },
    
    resizeImage: function(how){
        var viewWidth = window.innerWidth - 50; // remove 50 pixels to avoid an eventual scrollbar
        var viewHeight = window.innerHeight - 98 - 50; // remove 98 pixels from navbar and scrollbar
        
        switch (how) {
            case 'byWidth':
                this.multiplier = viewWidth/this.image.width;
                break;
            case 'byHeight':
                this.multiplier = viewHeight/this.image.height;
                break;
            case 'original':
                this.multiplier = 1;
                break;
            default:
                this.multiplier = 1;
        }
        
        
    },
    
    resizeOverviewImage: function(how){
        var viewWidth = 390;
        var viewHeight = window.innerHeight - 98 - 50 - 26; // remove 98 pixels from navbar, scrollbar and overview title
        
        switch (how) {
            case 'byWidth':
                this.overviewMultiplier = viewWidth/this.image.width;
                break;
            case 'byHeight':
                this.overviewMultiplier = viewHeight/this.image.height;
                break;
            default:
                this.overviewMultiplier = 1;
        }
        
        
    },
    
    showOverview: function(){
        this.overviewVisible = !this.overviewVisible;
        this.resizeOverviewImage('byWidth');
        this.refreshAttributes();
    },
    
    refreshAttributes: function(){
        this.attributes = [];
        for (var i = 0; i < this.blocks.length; i++) {
            for (var j = 0; j < this.blocks[i].object.attributes.length; j++) {
                var attribute = this.blocks[i].object.attributes[j];
                // é usado na overview para mostrar o nome do objeto que possui o attributo
                attribute.block = this.blocks[i];
                this.attributes.push(attribute);
            }
        }
    },
    
    showObjectEditor: function(block){
        this.showEdit = true;
        this.showAllObjects = false;
        this.editedBlockImage = this.image;
        this.editedBlock = block;
    },
    
    showObjectViewer: function(){
        this.showAllObjects = true;
        this.objectViewerAction = ImageTaggerComponent.actions.edit;
    },
    
    showRelationList: function(){
        this.isRelationListVisible = true;
    },
    
    addRelation: function(){
        this.selectedRelation = {blocks: [], name:""};
        this.relationEditorIsVisible = true;
    },
    
    addNewBox: function(){
        this.x = 0;
        this.y = 0;
        this.width = 100;
        this.height = 100;
        this.show = true;
    },
    
    updateSelection: function(x, y){
        this.x = Math.min(x, this.initialX) / this.multiplier;
        this.y = Math.min(y, this.initialY) / this.multiplier;
        this.width = Math.abs(x - this.initialX) / this.multiplier;
        this.height = Math.abs(y - this.initialY) / this.multiplier;
    },
    
    clickedPos: function(event){
        var image = document.querySelector('.image-container .image');
        var rect = image.getBoundingClientRect();
        
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
    
    stopDragging: function(){
        this.dragging = false;
        this.handle = null;
    },
    
    mousemove: function($event){
        var x = this.clickedPos($event).x;
        var y = this.clickedPos($event).y;
        
        if(this.dragging){
            // since the user drag the selection, show it
            this.show = true;
            this.updateSelection(x, y);
        }
        if(this.handle){
            this.updateSelection(x, y);
        }
    },
    
    mousedown: function($event){
        if($event.which !== 1) return;
        $event.preventDefault();
        if(this.handle) return;
        
        this.dragging = true;
        
        this.initialX = this.clickedPos($event).x;
        this.initialY = this.clickedPos($event).y;
    },
    
    mouseup: function($event){
        this.stopDragging();
    },
    
    mouseleave: function($event){
        this.stopDragging();
    },
    
    addBox: function(event){
        if(event.keyCode !== 13) return;
        if(!this.show) return;
        event.preventDefault();
        
        var block = null;
        if(this.isEditingExistingBlock){
            this.editedBlock.x = this.x;
            this.editedBlock.y = this.y;
            this.editedBlock.width = this.width;
            this.editedBlock.height = this.height;
            
            if(this.editedBlock.id !== -1) {
                this.image.blocks.push(this.editedBlock);
            }
            
            block = this.editedBlock;
            
            this.isEditingExistingBlock = false;
        } else {
            block = {
                id: -1,
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
                object: {name: '', attributes: []}
            };
        }
        this.showObjectEditor(block);
        if(this.objectTagEditFromOverview){
            this.overviewVisible = true;
        }
    },
    
    handleMousedown: function($event, handle){
        if($event.which !== 1) return;
        this.handle = handle;
        if(handle === 'top-left'){
            this.initialX = this.x * this.multiplier + this.width * this.multiplier;
            this.initialY = this.y * this.multiplier + this.height * this.multiplier;
        }
        if(handle === 'top-right'){
            this.initialX = this.x * this.multiplier;
            this.initialY = this.y * this.multiplier + this.height * this.multiplier;
        }
        if(handle === 'bottom-left'){
            this.initialX = this.x * this.multiplier + this.width * this.multiplier;
            this.initialY = this.y * this.multiplier;
        }
        if(handle === 'bottom-right'){
            this.initialX = this.x * this.multiplier;
            this.initialY = this.y * this.multiplier;
        }
    },
    
    onBlockClicked: function(event, block){
        if(this.ctrlPressed){
            if(this.selectedRelation === null){
                this.selectedRelation = {blocks: [], name:""};
            }
            this.selectedRelation.blocks.push(block);
            
            if(this.selectedRelation.blocks.length === 2){
                this.relationEditorIsVisible = true;
            }
        }
    },
    
    onObjectEditorSave: function(){
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
                this.editedBlock.id = response.data.id
            }
            this.show = false;
            this.showEdit = false;
            this.refreshAttributes();
            
            showLoadingOverlay(false);
        }.bind(this));
    },
    
    onObjectEditorEdit: function(){
        this.isEditingExistingBlock = true;
        this.show = true;
        this.x = this.editedBlock.x;
        this.y = this.editedBlock.y;
        this.width = this.editedBlock.width;
        this.height = this.editedBlock.height;
        
        if(this.editedBlock.id !== -1) {
            var index = this.image.blocks.indexOf(this.editedBlock);
            this.image.blocks.splice(index, 1);
        }
        
        this.showEdit = false;
        this.showAllObjects = false;
        
        // no caso de abrir da overview
        this.overviewVisible = false;
        this.objectTagEditFromOverview = true;
    },
    
    onObjectEditorClose: function(){
        this.showEdit = false;
        
        if(this.objectViewerAction == ImageTaggerComponent.actions.edit){
            this.showAllObjects = true;
        }
    },
    
    onObjectViewerBlockSelected: function(block, action){
        if(action == ImageTaggerComponent.actions.edit){
            this.showObjectEditor(block);
        }
        if(action == ImageTaggerComponent.actions.select){
            this.selectedRelation.blocks[this.relationBlockSelected] = block;
            this.showAllObjects = false;
            this.relationEditorIsVisible = true;
        }
    },
    
    onObjectViewerClose: function(){
        this.showAllObjects = false;
        
        if(this.objectViewerAction == ImageTaggerComponent.actions.select){
            this.relationEditorIsVisible = true;
        }
        
        this.objectViewerAction = "";
    },
    
    onRelationEditorClose: function(){
        if(this.originalRelation) {
            this.selectedRelation.name = this.originalRelation.name;
            this.selectedRelation.blocks[0] = this.originalRelation.blocks[0];
            this.selectedRelation.blocks[1] = this.originalRelation.blocks[1];
        }
        
        this.closeRelationEditor();
    },
    
    closeRelationEditor: function(){
        this.relationEditorIsVisible = false;
        this.selectedRelation = null;
        
        if(this.openedRelationEditorFromList){
            this.isRelationListVisible = true;
            this.openedRelationEditorFromList = false;
        }
    },
    
    onRelationEditorSave: function(){
        showLoadingOverlay(true, "Salvando...");
        this.$http({
            method: 'POST',
            url: 'image/save/relation',
            data: {
                'id': this.selectedRelation.id || null,
                'originTagId': this.selectedRelation.blocks[0].id, 
                'targetTagId': this.selectedRelation.blocks[1].id,
                'name': this.selectedRelation.name
            }
        })
        .then(function onRelationSaved(response){
            this.selectedRelation.id = response.data.id;
            if(this.relations.indexOf(this.selectedRelation) === -1){
                this.relations.push(this.selectedRelation);
            };
            this.closeRelationEditor();
            
            showLoadingOverlay(false);
        }.bind(this));
    },
    
    onRelationEditorBlockSelected: function(index){
        this.relationEditorIsVisible = false;
        this.showAllObjects = true;
        this.objectViewerAction = ImageTaggerComponent.actions.select;
        this.relationBlockSelected = index;
    },
    
    showRelationEditor: function(relation){
        this.isRelationListVisible = false;
        this.selectedRelation = relation;
        this.originalRelation = {
            blocks: [relation.blocks[0], relation.blocks[1]],
            name: relation.name
        }
        this.relationEditorIsVisible = true;
    },
    
    onRelationListRelationSelected: function(relation){
        this.showRelationEditor(relation);
        
        this.openedRelationEditorFromList = true;
    },
    
    onRelationListClose: function(){
        this.isRelationListVisible = false;
    },
    
    onClose: function(){
        // expose event
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
    }
};