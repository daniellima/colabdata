# Colabdata

Repositório do Trabalho Final de Curso de Gabriel Freire e Daniel Lima

## Instalação

### Configurando o servidor

Configure o Django com o servidor web que preferir.

O projeto foi desenvolvido com python 3.4.3

Para importação e exportação de datasets, o modulo zlib deve estar funcionando.
Se `import zlib` funcionar no interpretador python, deve estar tudo ok.

### Arquivos estáticos

Além de configurar a interação entre o servidor e o Django, é necessário configurar o servidor para servir os conteudos estáticos do projeto.

As pastas `/static` e `/media` na raiz do repositorio devem ser liberadas para acesso via URL.

Depois, vá no arquivo `colabdata/settings.py` e altere a variavel `STATIC_URL` para a URL que aponta para o diretorio `/static` e a variavel `MEDIA_URL` para a URL que aponta para o diretorio `/media`.

Em seguida, rode o comando `python manage.py collectstatic`.

Atenção, a pasta `/private_media` **NÃO** deve ser aberta para acesso via URL. O acesso para esses arquivos necessita de autenticação e por isso é gerenciado pelo proprio Django.

Finalmente, as pastas `/media` e `/private_media` devem ser configuradas com permissões de escrita, já que o sistema criará conteúdo nelas.

### Criando Banco de Dados

Uma vez configurado com o servidor, é necessário rodar esses tres comandos, na pasta do projeto:

`python manage.py migrate` para criar as tabelas no banco

`python manage.py createsuperuser` para criar um usuario inicial

`python manage.py loaddata groups` para criar os dados fixos do banco

### Configurando o Projeto

Agora abra o arquivo `colabdata/settings.py`, que é o arquivo de configuração do Django.

Na lista `ALLOWED_HOSTS`, adicione o dominio de onde o sistema será servido.

Finalmente, mude a variavel `DEBUG` para `False`, caso esteja instalando em produção.

### Testando o funcionamento

O sistema já deve estar funcionando. Para logar, acesse `{url do site}`.
Para acessar a area administrativa, basta logar como um administrador ou superuser e clicar em Admin na navegação..
Os colaboradores podem clicar em "My Datasets" para ver os datasets que tem acesso e clicar em "Start contributing" para começar a contribuir.