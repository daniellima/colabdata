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
                //config.url = urls.root + config.url;
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
    onthology: {objects:[], attributes:[], relations:[]},
    setOnthology: function(onthology){
        this.onthology = onthology;
    },
    getOnthology: function(){
        return this.onthology;
    },
    getObjectTypes: function() {
        return this.onthology.objects;
    },
    getRelationTypes: function() {
        return this.onthology.relations;
    },
    getAttributeTypes: function() {
        return this.onthology.attributes;
    },
    getValuesForAttributeType: function(attributeTypeName) {
        for(var i = 0; i < this.onthology.attributes.length; i++) {
            var attributeType = this.onthology.attributes[i];
            if(attributeType.name == attributeTypeName) {
                return attributeType.values;
            }
        }
    },
    
    saveRelation: function($http, relationToSave, newName, newOriginTag, newTargetTag){
        return $http({
            method: 'POST',
            url: urls.saveRelation,
            data: {
                'id': relationToSave == null ? null : relationToSave.id,
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
            url: urls.deleteRelation,
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
            url: urls.saveTag,
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
            url: urls.deleteTag,
            data: {
                'id': tag.id
            }
        }).then(function(){
            this.image.tags.splice(this.image.tags.indexOf(tag), 1);
        }.bind(this));
    },
    
    mergeTags: function($http, tagIds, mergedObject, mergedAttributes, mergedMarker) {
        var tagJSON = {
            id: null,
            object: {name: mergedObject, attributes: []},
            x: mergedMarker.x,
            y: mergedMarker.y,
            width: mergedMarker.width,
            height: mergedMarker.height,
        };
        for(var i = 0; i < mergedAttributes.length; i++) {
            var attribute = mergedAttributes[i];
            tagJSON.object.attributes.push({name: attribute.name, value: attribute.value});
        }
        return $http({
            method: 'POST',
            url: urls.mergeTags,
            data: {
                'idsOfTagsToBeMerged': tagIds,
                'mergedTagData': tagJSON
            }
        }).then(function(response){
            
            var mergedTag = {
                id: response.data.id,
                relations: [],
            };
            
            mergedTag.object = mergedObject;
            mergedTag.x = mergedMarker.x;
            mergedTag.y = mergedMarker.y;
            mergedTag.width = mergedMarker.width;
            mergedTag.height = mergedMarker.height;
            mergedTag.attributes = [];
            for(var i = 0; i < mergedAttributes.length; i++) {
                var attribute = mergedAttributes[i];
                mergedTag.attributes.push({name: attribute.name, value: attribute.value, tag: mergedTag});
            }
            
            var relations = this.getAllRelations();
            var mergedRelations = [];
            var j = 0;
            var mergedRelation = null;
            for(i = 0; i < relations.length; i++) {
                var relation = relations[i]; 
                var alreadyMerged = false;
                
                if(tagIds.indexOf(relation.originTag.id) != -1) {
                    relation.originTag.relations.splice(relation.originTag.relations.indexOf(relation), 1);
                    for(j = 0; j < mergedRelations.length; j++) {
                        mergedRelation = mergedRelations[j];
                        if(relation.name == mergedRelation.name && relation.targetTag == mergedRelation.targetTag) {
                            alreadyMerged = true;
                            break;
                        }
                    }
                    if(!alreadyMerged) {
                        mergedRelations.push(relation);
                        mergedTag.relations.push(relation);
                        relation.originTag = mergedTag;
                    }
                }
            }
            var mergedRelations = [];
            for(i = 0; i < relations.length; i++) {
                var relation = relations[i]; 
                var alreadyMerged = false;
                
                if(tagIds.indexOf(relation.targetTag.id) != -1) {
                    for(j = 0; j < mergedRelations.length; j++) {
                        mergedRelation = mergedRelations[j];
                        if(relation.name == mergedRelation.name && relation.originTag == mergedRelation.originTag) {
                            alreadyMerged = true;
                            break;
                        }
                    }
                    if(!alreadyMerged) {
                        mergedRelations.push(relation);
                        relation.targetTag = mergedTag;
                    }
                    else {
                        relation.originTag.relations.splice(relation.originTag.relations.indexOf(relation), 1);
                    }
                }
            }
            
            this.image.tags.push(mergedTag);
            for(var i = this.image.tags.length-1; i >= 0; i--) {
                var tag = this.image.tags[i];
                if(tagIds.indexOf(tag.id) != -1) {
                    this.image.tags.splice(i, 1);
                }
            }
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

ColabDataApp.component('mergeViewer', MergeViewerComponent.definition);

ColabDataApp.component('mergePreview', MergePreviewComponent.definition);

ColabDataApp.component('imageTagger', ImageTaggerComponent.definition);

ColabDataApp.component('objectThumbnail', ObjectThumbnailComponent.definition);

ColabDataApp.component('relationEditor', RelationEditorComponent.definition);

ColabDataApp.component('relationList', RelationListComponent.definition);

ColabDataApp.component('overview', OverviewComponent.definition);

ColabDataApp.component('mainComponent', MainComponent.definition);

deepFirstSearch = function(root) {
    var listToExplore = [ root ];
    var visited = [];
    
    root.visited = true;
    visited.push(root);
    
    while ( listToExplore.length > 0 ) {
        var node = listToExplore.shift();
        for(var i = 0; i < node.links.length; i++) {
            if ( !node.links[i].visited ) {
                node.links[i].visited = true;
                visited.push(node.links[i]);
                listToExplore.push( node.links[i] );
            }
        };
    }
    
    return visited
}

groupTags = function(tags, isRelated) {
    // build a graph where each tag is a node and the function
    // isRelated(node1, node2) is true when there is an edge beetween
    // node1 and node2.
    var nodes = [];
    for(var i = 0; i < tags.length; i++) {
        var node = {data: tags[i], visited: false, links: []};
        nodes.push(node);
    }
    for(var i = 0; i < nodes.length; i++) {
        for(var j = i + 1; j < nodes.length; j++) {
            if(isRelated(nodes[i].data, nodes[j].data)) {
                nodes[i].links.push(nodes[j]);
                nodes[j].links.push(nodes[i]);
            }
        }
    }
    // finds the connected components of the graph
    var connectedComponents = [];
    for(var i = 0; i < nodes.length; i++) {
        if(!nodes[i].visited) {
            var visited = deepFirstSearch(nodes[i]);
            var tags = [];
            for(var j = 0; j < visited.length; j++) {
                tags.push(visited[j].data);
            }
            connectedComponents.push(tags);
        }
    }
    
    return connectedComponents;
}

tagsAreSimilar = function(tag1, tag2) {
    
    var xOverlap = Math.max(0, Math.min(tag1.x+tag1.width, tag2.x+tag2.width) - Math.max(tag1.x,tag2.x));
    var yOverlap = Math.max(0, Math.min(tag1.y+tag1.height, tag2.y+tag2.height) - Math.max(tag1.y,tag2.y));
    var overlapArea = Math.floor(xOverlap * yOverlap);
    var tag1Area = Math.floor(tag1.width * tag1.height);
    var tag2Area = Math.floor(tag2.width * tag2.height);
    
    var overlapPercent = 0.7;
    var overlapedMuchOfTag1Area = (overlapArea >= tag1Area * overlapPercent);
    var overlapedMuchOfTag2Area = (overlapArea >= tag2Area * overlapPercent);
    
    if(tag1.object == tag2.object) {
        if((overlapArea == tag1Area) || (overlapArea == tag2Area)) { // one inside another
            return true;
        }
        if(overlapedMuchOfTag1Area || overlapedMuchOfTag2Area) {
            return true;
        }
    }
    else {
        if(overlapedMuchOfTag1Area && overlapedMuchOfTag2Area) {
            return true;
        }
    }
    
    return false;
}

prefetchImage = function($q, url) {
    var promise = $q(function(resolve, reject) {

        var imgElement = new Image();

        imgElement.addEventListener('load', function () {
            resolve(this);
        });

        imgElement.addEventListener('error', function () {
            console.log('image "'+url+'" not loaded');
            reject();
        })

        imgElement.src = url;

    });
    
    return promise;
}

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