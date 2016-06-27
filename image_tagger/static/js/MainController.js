var MainController = function($http){

    this.showTagger = false;

    this.images = [];
    this.selectedImage = null;
    
    $http({method: 'get', url: 'image/all'})
    .then(function loadImages(response){
        this.images = response.data.images;
    }.bind(this));
}

MainController.prototype = {
    
    onImageTaggerClose: function(){
        this.showTagger = false;
    },
    
    onImageChooserChoose: function(image){
        this.showTagger = true;
        this.selectedImage = image;
    },

}