var component = ObjectThumbnailComponent = function(){};

component.definition = {
    controller: component,
    templateUrl: 'static/js/components/objectThumbnail.html',
    bindings: {
        image: '<',
        block: '<',
        size: '@'
    }
},

component.prototype = {

    $onChanges: function(changes){
        if(this.block && this.size){
            this.updateScale();
        }
    },
    
    updateScale: function(){

        var greaterDimension = Math.max(this.block.width, this.block.height);
        this.scale = this.size / greaterDimension;
    }
};