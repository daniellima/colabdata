var MainController = function($http){

    this.$http = $http;

    this.images = [];
    this.selectedImage = null;
    
    this.userLogged = false;
    this.page = 'login-form';
    
    if(localStorage.userLogged){
        this.onLogin();
    }
}

MainController.prototype = {
    
    onImageTaggerClose: function(){
        this.page = 'image-chooser';
    },
    
    onImageChooserChoose: function(image){
        this.page = 'image-tagger';
        this.selectedImage = image;
    },
    
    onLogin: function(){
        this.userLogged = true;
        localStorage.userLogged = this.userLogged;
        this.page = 'image-chooser';
        
        this.$http({method: 'get', url: 'image/all'})
        .then(function loadImages(response){
            this.images = response.data.images;
        }.bind(this));
    },
    
    onSairButtonClick: function(){
        
        this.$http({
            method: 'POST',
            url: 'image/logout'
        })
        .then(function(response){
            this.userLogged = false;
            localStorage.clear();
            this.page = 'login-form';
        }.bind(this), function(){
            // dar feedback pro usuario
        }.bind(this))
    }

}