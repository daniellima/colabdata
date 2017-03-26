# Colabdata

Repositório do Trabalho Final de Curso de Gabriel Freire e Daniel Lima

# Instalação

Configure o Django com o servidor web que preferir.

O projeto foi desenvolvido com python 3.4.3

Para importação e exportação de datasets, o modulo zlib deve estar funcionando.
Se `import zlib` funcionar no interpretador python, deve estar tudo ok.

Uma vez configurado com o servidor, é necessário rodar esses tres comandos, na pasta do projeto:

`python manage.py migrate` para criar as tabelas no banco

`python manage.py createsuperuser` para criar um usuario inicial

`python manage.py loaddata groups` para criar os dados fixos do banco

Agora abra o arquivo `colabdata/settings.py` e na configuração `ALLOWED_HOSTS`, adicione o dominio de onde o sistema será servido na lista.

O sistema já deve estar funcionando. 
Para acessar a area administrativa, basta acessar `{url do site}/admin` e logar com o usuario criado anteriormente.
Os colaboradores podem logar por `{url do site}` e clicar em "Start contributing" para ver os datasets que tem acesso.