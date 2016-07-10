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
            }
        }
    });
}]);

ColabDataApp.component('objectEditor', {
    controller: ObjectEditorComponent,
    templateUrl: "static/js/components/objectEditor.html",
    bindings: {
        editedBlock: '<',
        editedBlockImage: '<',
        onClose: '&',
        onSave: '&',
        onEdit: '&'
    }
});

ColabDataApp.component('objectViewer', ObjectViewerComponent.definition);

ColabDataApp.component('imageChooser', {
    controller: ImageChooserComponent,
    templateUrl: "static/js/components/imageChooser.html",
    bindings: {
        images: '<',
        onChoose: '&'
    }
});

ColabDataApp.component('imageTagger', {
    controller: ['$rootScope', '$http', '$document', ImageTaggerComponent],
    templateUrl: "static/js/components/imageTagger.html",
    bindings: {
        image: '<',
        onClose: '&'
    }
});

ColabDataApp.component('objectThumbnail', ObjectThumbnailComponent.definition);

ColabDataApp.component('relationEditor', RelationEditorComponent.definition);

ColabDataApp.component('relationList', RelationListComponent.definition);

ColabDataApp.component('overview', OverviewComponent.definition);

ColabDataApp.component('loginForm', LoginFormComponent.definition);

ColabDataApp.controller('MainController', ['$http', MainController])