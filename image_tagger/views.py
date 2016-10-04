# encoding: utf-8

from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from models import ImageData, Tag, Objeto, Attribute, Relation
from django.contrib.staticfiles.templatetags.staticfiles import static
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
import json
from PIL import Image
import os
from os import listdir
from os.path import isfile, join

def login_required_for_api(f):
    
    def decoration(request):
        print(request.user.is_authenticated())
        if request.user.is_authenticated():
            return f(request)
        else:
            return HttpResponse(status=401)
            
    return decoration

# Create your views here.

@login_required_for_api
def get_all(request):
    
    images = ImageData.objects.all()

    data = map(lambda image: {
        'id': image.id,
        'url': static('tagged_images/' + image.address),
        'width': image.width,
        'height': image.height,
        'blocks': [tag.toJSONSerializable() for tag in image.tags.filter(user=request.user)]
    }, images)
    
    return JsonResponse({'images': data})

@login_required_for_api
def post_save_tag(request):
    
    sent = json.loads(request.body)
    image_data = ImageData.objects.get(pk=sent['imageId'])

    if Tag.objects.filter(pk=sent['tag']['id']).exists():
        Tag.objects.filter(pk=sent['tag']['id']).delete()
    
    object = Objeto.objects.create(name = sent['tag']['object']['name'])
    
    for attribute in sent['tag']['object']['attributes']:
        Attribute.objects.create(name=attribute['name'], value=attribute['value'], object=object)
    
    tag = Tag()
    tag.user = request.user
    tag.x = sent['tag']['x']
    tag.y = sent['tag']['y']
    tag.width = sent['tag']['width']
    tag.height = sent['tag']['height']
    tag.image_data = image_data
    tag.object = object
    tag.save()
    
    return JsonResponse({'id': tag.id})
    
@login_required_for_api
def post_save_relation(request):
    
    sent = json.loads(request.body)
    
    print(sent)
        
    relation, created = Relation.objects.update_or_create(
        id=sent['id'],
        defaults={
            'name': sent['name'],
            'originTag': Tag.objects.get(pk=sent['originTagId']),
            'targetTag': Tag.objects.get(pk=sent['targetTagId'])
        })
    
    return JsonResponse({'id': relation.id})
    
def add_users(request):
    User.objects.all().delete()
    
    User.objects.create_user('Daniel', 'daniel@colabdata.com', '1234')
    User.objects.create_user('João', 'joaocarlos@colabdata.com', '1234')
    User.objects.create_user('Fabrício', 'fabricio@colabdata.com', '1234')
    User.objects.create_user('Gabriel', 'gabriel@colabdata.com', '1234')
    return HttpResponse('Usuarios criados!')

def add_images(request):
    path = os.path.dirname(__file__)+"/static/tagged_images"
    files = [f for f in listdir(path) if isfile(join(path, f))]
    
    response = []
    for file in files:
        im = Image.open(join(path, file))
        width, height = im.size
        try:
            image_data = ImageData.objects.get(address=file)
            image_data.width = width
            image_data.height = height
            image_data.save()
        except ImageData.DoesNotExist:
            ImageData.objects.create(address = file, width = width, height = height)
        
        #response.append((file, width, height))
    
    for image_data in ImageData.objects.all():
        if not image_data.address in files:
            image_data.delete()
            #response.append(image_data.address)
       
    return HttpResponse("Imagens sincronizadas")

def post_login(request):
    sent = json.loads(request.body)
    
    username = sent['email']
    password = sent['senha']
    print(username)
    print(password)
    user = authenticate(username=username, password=password)
    print(user)
    if user is not None:
        login(request, user)
        return HttpResponse()
    else:
        return HttpResponse(status=400)

@login_required_for_api        
def post_logout(request):
    logout(request)
    
    return HttpResponse()