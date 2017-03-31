/* global angular */
var component = MergeViewerComponent = function($rootScope, $http){
    this.$rootScope = $rootScope;
    this.$http = $http;
    
    this.pages = {MERGING:0, NO_MERGE:1, FINISHED_MERGE:2};
    
    this.tags = [];
    this.mergeGroups = [];
    this.page = this.pages.NO_MERGE;
    
    this.open = false;
    $rootScope.$on('merge-requested', function(event, data) {
        this.setOpen(true);
        this.mergeGroups = [];
        var tags = this.image().tags;
        
        for(var i = 0; i < tags.length; i++) {
            var tag1 = tags[i];
            for(var j = 0; j < this.mergeGroups.length; j++) {
                var group = this.mergeGroups[j];
                for(var k = 0; k < group.length; k++) {
                    var tag2 = group[k];
                    if(tagsAreSimilar(tag1, tag2)) {
                        group.push(tag1);
                        k = +Infinity;
                        j = +Infinity;
                    }
                }
            }
            if(j != +Infinity) this.mergeGroups.push([tag1])
        }
        for(i = this.mergeGroups.length-1; i >= 0; i--) {
            if(this.mergeGroups[i].length == 1) {
                this.mergeGroups.splice(i, 1);
            }
        }
        if(this.mergeGroups.length == 0){
            this.page = this.pages.NO_MERGE;
        }
        else {
            this.page = this.pages.MERGING;
            this.tags = this.mergeGroups.shift();    
        }
        
        this.callback = data.callback;
    }.bind(this));
    
    this.image = function() {
        return store.getImage();
    };
};

component.definition = {
    controller: ['$rootScope', '$http', component],
    templateUrl: urls.template("mergeViewer.html"),
    bindings: {}
};

component.prototype = {
    
    showNextGroup: function() {
        if(this.mergeGroups.length) {
            this.tags = this.mergeGroups.shift();
        }
        else {
            this.page = this.pages.FINISHED_MERGE;
        }
    },
    
    closeButtonClickHandler: function() {
        this.setOpen(false);
        this.callback();
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
    
    confirmMergeButtonClickHandler: function(){
        this.setOpen(false);
        
        this.$rootScope.$emit('merge-preview-requested', {
            tags: this.tags,
            callback: function(merged){
                this.setOpen(true);
                
                if(merged) {
                    this.showNextGroup();
                }
            }.bind(this)
        });
    },
    
    skipAndShowNextMergeButtonClickHandler: function() {
        this.showNextGroup();
    },
    
    noTagsToMergeButtonClickHandler: function() {
        this.setOpen(false);
        this.callback();
    },
    
    mergeFinishedButtonClickHandler: function() {
        this.setOpen(false);
        this.callback();
    }
    
};