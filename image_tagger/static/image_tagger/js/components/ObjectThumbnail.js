var component = ObjectThumbnailComponent = function(){
    
    this.scale = function() {
        if(!this.block) return 0;
        
        var greaterDimension = Math.max(this.block.width, this.block.height);
        return this.size / greaterDimension;
    }
};

component.definition = {
    controller: component,
    templateUrl: urls.template('objectThumbnail.html'),
    bindings: {
        image: '<',
        block: '<',
        size: '<'
    }
},

component.prototype = {

    $onChanges: function(changes){},
};