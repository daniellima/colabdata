var component = LoginFormComponent = function($http){
    this.$http = $http;
};

component.definition = {
    controller: ['$http', component],
    templateUrl: 'static/js/components/loginForm.html',
    bindings: {
        onLogin: '&'
    }
},

component.prototype = {

    $onChanges: function(changes){
        
    },
    
    $onInit: function(){
        this.email = "";
        this.senha = "";
        this.message = "";
    },
    
    onCleanMessageButtonClick: function(){
        this.message = "";
    },
    
    onEnterButtonClick: function(){
        this.message = "";
        if(!this.email || !this.senha) {
            this.message = "É preciso preencher login e senha!"
            return;
        }
        
        showLoadingOverlay(true, "Logando...");
        this.$http({
            method: 'POST',
            url: 'image/login',
            data: {
                'email': this.email, 
                'senha': this.senha
            }
        })
        .then(function(response){
            this.email = '';
            this.senha = '';
            this.onLogin();
            
            showLoadingOverlay(false);
        }.bind(this), function(){
            this.message = "Credenciais inválidas!"
        }.bind(this));
    }
};