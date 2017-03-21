var MainComponent = function($rootScope, $http, $q){
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.$q = $q;

    // this.images = [];
    this.seletedImageIndex = 0;
    this.selectedImage = null;
    this.hasNextImage = true;
    this.hasPreviousImage = function(){
        return this.seletedImageIndex != 0;
    };
    this.isLoadingImage = false;
    
    this.userLogged = false;
    this.page = 'image-tagger';
    
    this.requestImage(this.seletedImageIndex);
    
    // if(localStorage.userLogged == "true"){
    //     this.onLogin();
    // }
}

MainComponent.definition = {
    controller: ['$rootScope','$http', '$q', MainComponent],
    templateUrl: 'static/js/components/main.html'
}

MainComponent.prototype = {
    
    requestImage: function(imageIndex){
        showLoadingOverlay(true, "Carregando imagem...");
        this.isLoadingImage = true;
        this.datasetId = this.getDatasetIdFromURL();
        
        var response = null;
        this.$http({method: 'get', url: 'image/'+this.datasetId+'/'+imageIndex})
        .then(function (_response){
            response = _response;
            return prefetchImage(this.$q, response.data.image.url);

        }.bind(this))
        .then(function(){
            
            this.selectedImage = response.data.image;
            this.hasNextImage = response.data.has_next_image;
            
        }.bind(this), function(){
            
            showAndLogErrorThatOcurredDuringAction("carregar imagem", response, this.$rootScope);
            // TODO retornar para datasets se for o primeiro loading
            
        }.bind(this))
        .finally(function(){
            
            showLoadingOverlay(false);
            this.isLoadingImage = false;
            
        }.bind(this));
        
    },
    
    getDatasetIdFromURL: function() {
        var pathParts = window.location.pathname.split( '/' );
        return pathParts[pathParts.length-1];
    },
    
    onImageTaggerClose: function(){
        this.page = 'image-chooser';
    },
    
    onImageChooserChoose: function(image){
        this.page = 'image-tagger';
        // this.selectedImage = image;
    },
    
    onLogin: function(){
        this.userLogged = true;
        localStorage.userLogged = this.userLogged;
        this.page = 'image-tagger';
        
        showLoadingOverlay(true, "Carregando imagens...");
        this.$http({method: 'get', url: 'image/all'})
        .then(function (response){
            this.datasets = response.data.datasets;
            this.images = this.datasets[0].images;
            showLoadingOverlay(false);
        }.bind(this), function(){
            showLoadingOverlay(false);
        }.bind(this));
    },
    
    blurButton: function() {
        // The next and back buttons remain focused after the user click then.
        // This removes the focus. The problem is that pressing enter to add a object might 
        // trigger the click on the next or back button
        document.activeElement.blur();
    },
    
    backToDatasetsButtonClickHandler: function(){
        window.location = urls.privateDatasets;
    },
    
    previousImageButtonClickHandler: function(event) {
        if(this.isLoadingImage) return;
        
        this.seletedImageIndex--;
        this.requestImage(this.seletedImageIndex);
        this.blurButton();
    },
    
    nextImageButtonClickHandler: function(event) {
        if(this.isLoadingImage) return;
        
        this.seletedImageIndex++;
        this.requestImage(this.seletedImageIndex);
        this.blurButton();
    },
    
    sairButtonClickHandler: function(){
        showLoadingOverlay(true, "Saindo...")
        this.$http({
            method: 'POST',
            url: 'image/logout'
        })
        .then(function(response){
            this.userLogged = false;
            localStorage.clear();
            this.page = 'login-form';
            
            window.location = urls.index;
        }.bind(this), function(response){
            showLoadingOverlay(false);
            showAndLogErrorThatOcurredDuringAction("sair", response, this.$rootScope)
        }.bind(this))
    }

}