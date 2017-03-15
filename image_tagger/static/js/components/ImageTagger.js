/* global angular */
(function(){
var component = ImageTaggerComponent = function($rootScope, $http, $document){
    this.$http = $http;
    this.$rootScope = $rootScope;
    
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
    
    this.selectedTag = null;
    
    this.editingMarker = false;
    this.pageToReturn = null;
    
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
    
    $rootScope.$on('modal-opened', function(){
        this.dialogOpen = true;
    }.bind(this));
    
    $rootScope.$on('modal-closed', function(){
        this.dialogOpen = false;
    }.bind(this));
    
    $rootScope.$on('new-marker-requested', function(event, data){
        this.editingMarker = true;
        this.pageToReturn = this.currentPage;
        this.currentPage = this.pages.IMAGE;
        this.markerX = data.marker.x;
        this.markerY = data.marker.y;
        this.markerWidth = data.marker.width;
        this.markerHeight = data.marker.height;
        this.markerVisible = true;
        
        this.newMarkerCallback = data.callback;
    }.bind(this));
    
    $document.on('keypress', function(event){
        // Porque não funciona como o keyup e keydown?
        $rootScope.$apply(function(){
            this.setMarkerEnterKeypressHandler(event);
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

component.prototype = {
    $onChanges: function(changes){
        if(changes.image && changes.image.currentValue){
            this.imageResizeMethod = this.resizeMethods.BY_HEIGHT;
            store.setImage(changes.image.currentValue);
            this.markerVisible = false;
        }
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
    
    
    setMarkerEnterKeypressHandler: function(event){
        if(event.keyCode !== 13) return;
        if(!this.markerVisible) return;
        event.preventDefault();
        
        if(this.editingMarker) {
            this.editingMarker = false;
            this.currentPage = this.pageToReturn;
            this.markerVisible = false;
            this.newMarkerCallback({x: this.markerX, y: this.markerY, width: this.markerWidth, height: this.markerHeight})
        } else {
            this.$rootScope.$emit('tag-editor-requested', {
                marker: {x: this.markerX, y: this.markerY, width: this.markerWidth, height: this.markerHeight},
                callback: function(saved){
                    if(saved) {
                        this.markerVisible = false;
                    }
                }.bind(this)
            });
        }
    },
    
    
    backButtonClickHandler: function() {
        this.onClose();
    },
    
    newRelationButtonClickHandler: function(){
        this.$rootScope.$emit('relation-editor-requested', {
            callback: function(relation) {}.bind(this)
        });
    },
    
    newObjectButtonClickHandler: function(){
        this.markerX = 0;
        this.markerY = 0;
        this.markerWidth = 100;
        this.markerHeight = 100;
        this.markerVisible = true;
    },
    
    showObjectListButtonClickHandler: function(){
        this.$rootScope.$emit('tag-requested', {
            action: 'Editar',
            callback: function(){}.bind(this)
        });
    },
    
    showRelationListButtonClickHandler: function(){
        this.$rootScope.$emit('relation-list-requested', {
            callback: function(){}.bind(this)
        });
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
    
    // TODO remover isso
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
    
    tagContainerMouseupHandler: function($event){
        this.dragging = false;
    },
    
    tagContainerMouseleaveHandler: function($event){
        this.dragging = false;
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
    
    tagClickHandler: function($event, tag){
        if($event.ctrlKey){
            if(this.selectedTag === null){
                this.selectedTag = tag;
            } else {
                var relationToEdit = {
                    id: null,
                    name: "",
                    originTag: this.selectedTag,
                    targetTag: tag
                };
                this.$rootScope.$emit('relation-editor-requested', {
                    relation: relationToEdit,
                    callback: function() {}.bind(this)
                });
                this.selectedTag = null;
            }
        }
    }
    
};
})();