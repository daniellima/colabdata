/* global angular */
var ObjectEditorComponent = function($http){
    this.editedBlock = null;
    this.editedBlockImage = null;
    this.$http = $http;
    this.removedAttributes = [];
}

ObjectEditorComponent.prototype = {
    // getAttributes: function(){
    //     if(this.editedBlock == null) return [];
        
    //     var attributes = [];
    //     for (var i = 0; i < this.editedBlock.object.attributes.length; i++) {
    //         var attribute = this.editedBlock.object.attributes[i];
    //         if(this.removedAttributes.indexOf(attribute) == -1) {
    //             attributes.push(attribute);
    //         }
    //     }
    //     return attributes;
    // },
    addAttribute: function(){
        this.editedBlock.object.attributes.push({'name': '', 'value': ''});
    },
    removeAttribute: function(attribute){
        var attrs = this.editedBlock.object.attributes;
        attrs.splice(attrs.indexOf(attribute), 1);
    },
    deleteBlock: function() {
        showLoadingOverlay(true, "Deletando...");
        
        this.$http({
            method: 'POST',
            url: 'image/delete/tag',
            data: {
                'id': this.editedBlock.id
            }
        }).then(
            function(){
                this.blocks.splice(this.blocks.indexOf(this.editedBlock), 1);
                this.blockDeleted();
                showLoadingOverlay(false);
            }.bind(this),
            function(){
                console.log("Ocorreu um erro ao deletar bloco de id " +this.editedBlock.id);
                showLoadingOverlay(false);
            }.bind(this)
        );
    },
    saveBlock: function() {
        
    },
    onClose: function(){
        // exposed event
    },
    onSave: function(){
        // exposed event
    }
};