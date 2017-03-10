/* global angular */
var component = ObjectEditorComponent = function($http){
    this.editedBlock = null;
    this.editedBlockImage = null;
    this.$http = $http;
    this.removedAttributes = [];
}

component.definition = {
    controller: ['$http', component],
    templateUrl: "static/js/components/objectEditor.html",
    bindings: {
        editedBlock: '<',
        editedBlockImage: '<',
        blocks: '<',
        onBlockDeleted: '&',
        onClose: '&',
        onSave: '&',
        onEdit: '&'
    }
}

component.prototype = {
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
                this.onBlockDeleted();
                showLoadingOverlay(false);
            }.bind(this),
            function(){
                console.log("Ocorreu um erro ao deletar bloco de id " +this.editedBlock.id);
                showLoadingOverlay(false);
            }.bind(this)
        );
    }
};