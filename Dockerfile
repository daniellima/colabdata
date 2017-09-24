FROM ubuntu:16.04

# install so dependencies
RUN apt-get update && apt-get -y upgrade
RUN apt-get install -y python3 
RUN apt-get install -y python3-pip
RUN apt-get install -y nginx

# send code to image and set nginx configuration
WORKDIR /home/application
ADD . .
RUN cp docker/nginx-colabdata.conf /etc/nginx/sites-enabled/colabdata.conf
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

# install app dependencies
RUN pip3 install -r requirement.txt

ENTRYPOINT [ "bash", "-c", "./docker/entrypoint.sh" ]