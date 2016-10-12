/* global angular */
var ObjectEditorComponent = function(){
    this.editedBlock = null;
    this.editedBlockImage = null;
}

ObjectEditorComponent.prototype = {
    
    addAttribute: function(){
        this.editedBlock.object.attributes.push({'name': '', 'value': ''});
    },
    onClose: function(){
        // exposed event
    },
    onSave: function(){
        // exposed event
    }
};