var MainComponent = function($rootScope, $http, $q){
    this.$rootScope = $rootScope;
    this.$http = $http;
    this.$q = $q;

    this.seletedImageIndex = 0;
    this.selectedImage = null;
    this.hasNextImage = true;
    this.hasPreviousImage = function(){
        return this.seletedImageIndex != 0;
    };
    this.isLoadingImage = false;
    this.datasetId = this.getDatasetIdFromURL();
    
    this.requestOnthologyAndFirstImage();
}

MainComponent.definition = {
    controller: ['$rootScope','$http', '$q', MainComponent],
    templateUrl: urls.template('main.html')
}

MainComponent.prototype = {
    
    requestOnthologyAndFirstImage: function(){
        showLoadingOverlay(true, "Carregando ontologia...");
        
        return this.$http({
            method: 'get', 
            url: urls.datasetOnthology(this.datasetId)
        })
        .then(function(response){
            
            store.setOnthology(response.data);
            this.requestImage(this.seletedImageIndex);
            
        }.bind(this), function(response){
            
            showLoadingOverlay(false);
            showAndLogErrorThatOcurredDuringAction("carregar ontologia", response, this.$rootScope);
            
        }.bind(this));
    },
    
    requestImage: function(imageIndex){
        showLoadingOverlay(true, "Carregando dados da imagem...");
        this.isLoadingImage = true;
        
        var response = null;
        this.$http({
            method: 'get', 
            url: urls.image(this.datasetId, imageIndex)
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