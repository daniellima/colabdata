var MainComponent = function($http){

    this.$http = $http;

    this.images = [];
    this.selectedImage = null;
    
    this.userLogged = false;
    this.page = 'login-form';
    
    if(localStorage.userLogged == "true"){
        this.onLogin();
    }
}

MainComponent.definition = {
    controller: ['$http', MainComponent],
    templateUrl: 'static/js/components/main.html'
}

MainComponent.prototype = {
    
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
        
        showLoadingOverlay(true, "Carregando imagens...");
        this.$http({method: 'get', url: 'image/all'})
        .then(function (response){
            this.datasets = response.data.datasets;
            
            showLoadingOverlay(false);
        }.bind(this), function(){
            
            showLoadingOverlay(false);
        }.bind(this));
    },
    
    onSairButtonClick: function(){
        showLoadingOverlay(true, "Saindo...")
        this.$http({
            method: 'POST',
            url: 'image/logout'
        })
        .then(function(response){
            this.userLogged = false;
            localStorage.clear();
            this.page = 'login-form';
            
            showLoadingOverlay(false);
        }.bind(this), function(){
            // TODO dar feedback pro usuario
        }.bind(this))
    }

}