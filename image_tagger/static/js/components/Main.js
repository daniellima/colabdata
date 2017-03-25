var MainComponent = function($rootScope, $http, $q){
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.$q = $q;
    
    this.datasetId = this.getDatasetIdFromURL();
    
    this.imagePack = [];
    this.currentImageIndex = 0;
    this.currentImageId = function(){
        return this.imagePack[this.currentImageIndex];
    }
    this.currentImage = null;
    this.hasPreviousImage = function(){
        return this.currentImageIndex != 0;
    };
    this.isLoadingImage = false;
    this.datasetId = this.getDatasetIdFromURL();
    
    this.requestImages()
    .then(function(){
        this.requestOnthologyAndFirstImage();
    }.bind(this));
}

MainComponent.definition = {
    controller: ['$rootScope','$http', '$q', MainComponent],
    templateUrl: urls.template('main.html')
}

MainComponent.prototype = {
    
    requestImages: function() {
        showLoadingOverlay(true, "Carregando imagens...");
        
        var response = null;
        return this.$http({
            method: 'get', 
            url: urls.imagesPack(this.datasetId)
        })
        .then(function (response){
            
            this.imagePack = response.data.images;
            
        }.bind(this), function(response){
            
            showAndLogErrorThatOcurredDuringAction("carregando imagens", response, this.$rootScope);
            // TODO retornar para datasets se for o primeiro loading
            
        }.bind(this))
        .finally(function(){
            
            showLoadingOverlay(false);
            
        }.bind(this))
    },
    
    requestOnthologyAndFirstImage: function(){
        showLoadingOverlay(true, "Carregando ontologia...");
        
        return this.$http({
            method: 'get', 
            url: urls.datasetOnthology(this.datasetId)
        })
        .then(function(response){
            
            store.setOnthology(response.data);
            this.requestImage(this.currentImageId());
            
        }.bind(this), function(response){
            
            showLoadingOverlay(false);
            showAndLogErrorThatOcurredDuringAction("carregar ontologia", response, this.$rootScope);
            
        }.bind(this));
    },
    
    requestImage: function(imageId){
        showLoadingOverlay(true, "Carregando dados da imagem...");
        this.isLoadingImage = true;
        
        var response = null;
        this.$http({
            method: 'get', 
            url: urls.image(this.datasetId, imageId)
        })
        .then(function (_response){
            response = _response;
            
            showLoadingOverlay(true, "Carregando imagem...");
            return prefetchImage(this.$q, response.data.image.url);

        }.bind(this))
        .then(function(){
            
            this.selectedImage = response.data.image;
            this.hasNextImage = response.data.has_next_image;
            
        }.bind(this), function(response){
            
            showAndLogErrorThatOcurredDuringAction("carregar imagem", response, this.$rootScope);
            // TODO retornar para datasets se for o primeiro loading
            
        }.bind(this))
        .finally(function(){
            
            showLoadingOverlay(false);
            this.isLoadingImage = false;
            
        }.bind(this))
        
    },
    
    getDatasetIdFromURL: function() {
        var pathParts = window.location.pathname.split( '/' );
        return pathParts[pathParts.length-2];
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
        
        this.currentImageIndex--;
        this.requestImage(this.currentImageId());
        this.blurButton();
    },
    
    nextImageButtonClickHandler: function(event) {
        if(this.isLoadingImage) return;
        
        this.currentImageIndex++;
        if(this.currentImageIndex == this.imagePack.length) {
            this.requestImages()
            .then(function() {
                this.currentImageIndex = 0;
                this.requestImage(this.currentImageId());
            }.bind(this))
        } else {
            this.requestImage(this.currentImageId());    
        }
        
        this.blurButton();
    },
    
    logoutButtonClickHandler: function(){
        showLoadingOverlay(true, "Saindo...")
        this.$http({
            method: 'POST',
            url: urls.logout
        })
        .then(function(response){
            window.location = urls.index;
        }.bind(this), function(response){
            showLoadingOverlay(false);
            showAndLogErrorThatOcurredDuringAction("sair", response, this.$rootScope)
        }.bind(this))
    }

}