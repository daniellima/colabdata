/* global angular */
var ImageChooserComponent = function(){
    this.images = [];
}

ImageChooserComponent.prototype = {
    $onChanges: function(keys){
        angular.forEach(keys, function(value, key){
            switch(key){
                case "images":
                    
                    break;
            }
        }.bind(this));
    },
    onChoose: function(image){
        // expose event
    }
};