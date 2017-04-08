var urls = {};
urls.root = serverData.rootURL;
urls.privateDatasets = urls.root + 'private_datasets';
urls.index = urls.root;
urls.saveRelation = urls.root + 'save/relation';
urls.deleteRelation = urls.root + 'delete/relation';
urls.saveTag = urls.root + 'save/tag';
urls.deleteTag = urls.root + 'delete/tag';
urls.logout = urls.root + 'logout';
urls.mergeTags = urls.root + 'merge/tags';
urls.imagesPack = function(datasetId) {return urls.root + 'dataset/' + datasetId + '/images_pack'; };
urls.image = function(imageIndex) {return urls.root + 'dataset/image/' + imageIndex; };
urls.template = function(templateName){ return urls.root+'static/image_tagger/js/components/' + templateName; };
urls.datasetOnthology = function(datasetId){ return urls.root + 'dataset/'+datasetId+'/onthology'; };
