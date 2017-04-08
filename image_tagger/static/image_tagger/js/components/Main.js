var MainComponent = function($rootScope, $http, $q){
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.$q = $q;
    
    this.datasetId = this.getDatasetIdFromURL();
    
    this.imagesIds = [];
    this.currentImageIndex = 0;
    this.currentImage = null;
    this.hasPreviousImage = function(){
        return this.currentImageIndex != 0;
    };

    this.datasetId = this.getDatasetIdFromURL();
    
    if(serverData.use_onthology) {
        this.requestOnthology(function() {
            this.requestImages(function() {
                this.requestImage(this.currentImageIndex);
            }.bind(this));
        }.bind(this));
    } else {
        this.requestImages(function() {
            this.requestImage(this.currentImageIndex);
        }.bind(this));
    }
}

MainComponent.definition = {
    controller: ['$rootScope','$http', '$q', MainComponent],
    templateUrl: urls.template('main.html')
}

MainComponent.prototype = {
    
    requestOnthology: function(successCallback){
        showLoadingOverlay(true, "Carregando ontologia...");
        
        this.$http({
            method: 'get', 
            url: urls.datasetOnthology(this.datasetId)
        })
        .then(function(response){
            showLoadingOverlay(false);
            
            store.setOnthology(response.data);
            successCallback();
            
        }.bind(this), function(response){
            showLoadingOverlay(false);
            
            showAndLogErrorThatOcurredDuringAction("carregar ontologia", response, this.$rootScope);
            
        }.bind(this));
    },
    
    requestImages: function(successCallback) {
        showLoadingOverlay(true, "Carregando imagens...");
        
        this.$http({
            method: 'get', 
            url: urls.imagesPack(this.datasetId)
        })
        .then(function(response){
            showLoadingOverlay(false);
            
            this.imagesIds = response.data.images;
            successCallback();
            
        }.bind(this), function(response){
            showLoadingOverlay(false);
            
            showAndLogErrorThatOcurredDuringAction("carregar imagens", response, this.$rootScope);
            // TODO retornar para datasets se for o primeiro loading
            
        }.bind(this));
    },
    
    requestImage: function(imageIndex, successCallback){
        showLoadingOverlay(true, "Carregando dados da imagem...");
        
        var successCallback = successCallback || function(){};
        var imageId = this.imagesIds[imageIndex];
        
        this.$http({
            method: 'get', 
            url: urls.image(this.datasetId, imageId)
        })
        .then(function (response){
            showLoadingOverlay(true, "Carregando imagem...");
            
            prefetchImage(this.$rootScope, response.data.image.url, function(){
                showLoadingOverlay(false);
                
                this.selectedImage = response.data.image;
                this.hasNextImage = response.data.has_next_image;
                successCallback();
                
            }.bind(this), function(){
                showLoadingOverlay(false);
                
                showAndLogErrorThatOcurredDuringAction("carregar imagem", null, this.$rootScope);
                
            }.bind(this));

        }.bind(this), 
        function(response){
            showLoadingOverlay(false);
            
            showAndLogErrorThatOcurredDuringAction("carregar dados da imagem", response, this.$rootScope);
            // TODO retornar para datasets se for o primeiro loading
            
        }.bind(this));
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
        
        this.requestImage(this.currentImageIndex-1, function(){
            this.currentImageIndex--;
        }.bind(this));
        this.blurButton();
    },
    
    nextImageButtonClickHandler: function(event) {
        
        if(this.currentImageIndex+1 == this.imagesIds.length) {
            this.requestImages(function(){
                this.requestImage(0, function(){
                    this.currentImageIndex = 0;    
                }.bind(this));
            }.bind(this));
        } else {
            this.requestImage(this.currentImageIndex+1, function(){
                this.currentImageIndex++;
            }.bind(this));
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