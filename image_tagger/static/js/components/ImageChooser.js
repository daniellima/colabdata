/* global angular */
var component = ImageChooserComponent = function(){
    this.datasets = [];
}

component.definition = {
    controller: component,
    templateUrl: "static/js/components/imageChooser.html",
    bindings: {
        datasets: '<',
        onChoose: '&'
    }
}

component.prototype = {
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