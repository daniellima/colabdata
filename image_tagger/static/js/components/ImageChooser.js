/* global angular */
var ImageChooserComponent = function(){
    this.datasets = [];
}

ImageChooserComponent.prototype = {
    $onChanges: function(keys){
        angular.forEach(keys, function(value, key){
            switch(key){
                case "datasets":
                    
                    break;
            }
        }.bind(this));
    },
    onChoose: function(image){
        // expose event
    }
};