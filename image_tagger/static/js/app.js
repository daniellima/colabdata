/* global angular */
var ColabDataApp = angular.module('ColabDataApp', []);

ColabDataApp.config(['$httpProvider', function($httpProvider){
    
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    
    $httpProvider.interceptors.push(function ($q) {
        return {
            'request': function (config) {
                // transforma qualquer request para que ele sempre seja feito para o root do site
                // se a URL do site mudar, então tem que mudar aqui também!
                config.url = 'https://colabdata-tnik.c9users.io/' + config.url;
                return config || $q.when(config); // TODO não sei que $q é esse
            },
            'responseError': function(rejection) {
                // do something on error
                if (rejection.status == 401) {
                    localStorage.userLogged = false;
                    location.reload();
                }
                
                return $q.reject(rejection);
            }
        }
    });
}]);

store = {
    image: {url: "#", width:0, height:0, tags:[]},
    setImage: function(image) {
        this.image = image;
        for(var i = 0; i < this.image.tags.length; i++) {
            var tag = this.image.tags[i];
            for(var j = 0; j < tag.attributes.length; j++) {
                var attribute = tag.attributes[j];
                attribute.tag = tag;
            }
        };
        for (var i = 0; i < this.image.tags.length; i++) {
            var tag = this.image.tags[i];
            for (var j = 0; j < tag.relations.length; j++) {
                var relation = tag.relations[j];
                relation.originTag = tag;
                for(var k = 0; k < this.image.tags.length; k++) {
                    var possiblyTargetTag = this.image.tags[k];
                    if(possiblyTargetTag.id == relation.targetTagId) {
                        relation.targetTag = possiblyTargetTag;
                        break;
                    }
                }
            }
        }
    },
    getImage: function() {
        return this.image;
    },
    
    saveRelation: function($http, relationToSave, newName, newOriginTag, newTargetTag){
        return $http({
            method: 'POST',
            url: 'image/save/relation',
            data: {
                'id': relationToSave.id || null,
                'name': newName,
                'originTagId': newOriginTag.id, 
                'targetTagId': newTargetTag.id,
            }
        })
        .then(function (response){
            if(relationToSave === null) {
                relationToSave = { id: null };
            }
            
            // if already exists, remove relation from the old origin tag
            if(relationToSave.id) {
                for (var i = 0; i < this.image.tags.length; i++) {
                    var tag = this.image.tags[i];
                    for (var j = 0; j < tag.relations.length; j++) {
                        var pos = tag.relations.indexOf(relationToSave);
                        if(pos !== -1) {
                            tag.relations.splice(pos, 1);
                        }
                    }
                }
            }
            
            relationToSave.name = newName;
            relationToSave.originTag = newOriginTag;
            relationToSave.targetTag = newTargetTag;
            
            // add it to the new origin tag
            newOriginTag.relations.push(relationToSave);
            
            relationToSave.id = response.data.id;
        }.bind(this));
    },
    deleteRelation: function($http, relation) {
        return $http({
            method: 'POST',
            url: 'image/delete/relation',
            data: {
                'id': relation.id
            }
        }).then(function(response) {
            var relationTag = relation.originTag;
            var pos = relationTag.relations.indexOf(relation);
            relationTag.relations.splice(pos, 1);
        });
    },
    
    saveTag: function($http, tagToSave, newObject, newAttributes, newMarker) {
        var tagJSON = {
            id: tagToSave ? tagToSave.id : null,
            object: {name: newObject, attributes: []},
            x: newMarker.x,
            y: newMarker.y,
            width: newMarker.width,
            height: newMarker.height,
        };
        for(var i = 0; i < newAttributes.length; i++) {
            var attribute = newAttributes[i];
            tagJSON.object.attributes.push({name: attribute.name, value: attribute.value});
        }
        
        return $http({
            method: 'POST',
            url: 'image/save/tag',
            data: {
                'imageId': this.image.id,
                'tag': tagJSON
            }
        }).then(function(response){
            
            if(tagToSave == null) {
                tagToSave = {
                    id: response.data.id,
                    relations: [],
                };
                
                this.image.tags.push(tagToSave);
            }
            
            tagToSave.object = newObject;
            tagToSave.x = newMarker.x;
            tagToSave.y = newMarker.y;
            tagToSave.width = newMarker.width;
            tagToSave.height = newMarker.height;
            tagToSave.attributes = [];
            for(var i = 0; i < newAttributes.length; i++) {
                var attribute = newAttributes[i];
                tagToSave.attributes.push({name: attribute.name, value: attribute.value, tag: tagToSave});
            }
        }.bind(this));
    },
    deleteTag: function($http, tag){
        return $http({
            method: 'POST',
            url: 'image/delete/tag',
            data: {
                'id': tag.id
            }
        }).then(function(){
            this.image.tags.splice(this.image.tags.indexOf(tag), 1);
        }.bind(this));
    },
    
    _attributes: [],
    getAllAttributes: function() {
        // limpa e repopula a array sempre. Se uma nova array fosse retornada, o ciclo de digest nunca pararia. Ver: https://docs.angularjs.org/error/$rootScope/infdig
        this._attributes.splice(0, this._attributes.length);
        
        for (var i = 0; i < this.image.tags.length; i++) {
            var tag = this.image.tags[i];
            for (var j = 0; j < tag.attributes.length; j++) {
                var attribute = tag.attributes[j];
                this._attributes.push(attribute);
            }
        }
        
        return this._attributes;
    },
    
    _relations: [],
    getAllRelations: function(){
        // limpa e repopula a array sempre. Se uma nova array fosse retornada, o ciclo de digest nunca pararia. Ver: https://docs.angularjs.org/error/$rootScope/infdig
        this._relations.splice(0, this._relations.length);
        
        for (var i = 0; i < this.image.tags.length; i++) {
            var tag = this.image.tags[i];
            for (var j = 0; j < tag.relations.length; j++) {
                var relation = tag.relations[j];
                this._relations.push(relation);
            }
        }
        return this._relations;
    },
};

ColabDataApp.component('objectEditor', ObjectEditorComponent.definition);

ColabDataApp.component('objectViewer', ObjectViewerComponent.definition);

ColabDataApp.component('imageChooser', ImageChooserComponent.definition);

ColabDataApp.component('imageTagger', ImageTaggerComponent.definition);

ColabDataApp.component('objectThumbnail', ObjectThumbnailComponent.definition);

ColabDataApp.component('relationEditor', RelationEditorComponent.definition);

ColabDataApp.component('relationList', RelationListComponent.definition);

ColabDataApp.component('overview', OverviewComponent.definition);

ColabDataApp.component('loginForm', LoginFormComponent.definition);

ColabDataApp.component('mainComponent', MainComponent.definition);

showAndLogErrorThatOcurredDuringAction = function(action, response, $rootScope) {
    console.log(response);
    $rootScope.$emit('error-notification-requested', {
        error: {
            actionThatFailed: action,
        }
    });
}

/* TODO GAMBI PARA MOSTRAR LOADING DE QUALQUER LUGAR */
showLoadingOverlay = function(show, loadingMessage){
    if(show){
        $('.loading-overlay').removeClass('loading-overlay__hidden');
        $('.loading-overlay_content_text').text(loadingMessage ? loadingMessage : "Carregando...");
    }
    else {
        $('.loading-overlay').addClass('loading-overlay__hidden');
    }
}