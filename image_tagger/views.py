# encoding: utf-8
from models import Tag, ObjectType, AttributeType, AttributeTypeValue, Attribute, Image, Relation, RelationType, DatasetMembership
from django.utils import timezone
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib.staticfiles.templatetags.staticfiles import static
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.db.models import Count
import json
from PIL import Image as PILImage
import os
from os import listdir
from os.path import isfile, join

def login_required_for_api(f):
    
    def decoration(request):
        if request.user.is_authenticated():
            return f(request)
        else:
            return HttpResponse(status=401)
            
    return decoration

# Create your views here.

@login_required_for_api
def get_all(request):
    user = request.user
    datasets = user.datasets.filter(datasetmembership__group__name__in=["Curador", "Colaborador"]).distinct()
    datasets_for_response = []
    
    for dataset in datasets:
        images = dataset.images.annotate(number_of_contributors=Count('tags__user', distinct=True))
        
        if is_curator(user, dataset):
            ordered_images = images.order_by('-number_of_contributors')
        else:
            images_with_less_than_3_contributors = images.filter(number_of_contributors__lt=3).order_by('-number_of_contributors')
            images_with_3_or_more_contributors = images.filter(number_of_contributors__gt=2).order_by('number_of_contributors')
            
            ordered_images = list(images_with_less_than_3_contributors) + list(images_with_3_or_more_contributors)
        
        images_for_response = []
        for image in ordered_images:
            if is_curator(user, dataset):
                tags = image.tags.all()
            else:
                tags = image.tags.filter(user=user)
            
            images_for_response.append({
                'id': image.id,
                'url': image.file.url,
                'width': image.file.width,
                'height': image.file.height,
                'tags': [tag.toJSONSerializable() for tag in tags]
            })    
        
        
        dataset_for_response = {
            'name': dataset.name,
            'images': images_for_response,
        }
        
        datasets_for_response.append(dataset_for_response)
    
    return JsonResponse({'datasets': datasets_for_response})

def is_curator(user, dataset):
    return DatasetMembership.objects.filter(user=user, dataset=dataset, group__name="Curador").exists()

@login_required_for_api
def post_save_tag(request):
    
    sent = json.loads(request.body)
    image = Image.objects.get(pk=sent['imageId'])

    previous_user = None
    if Tag.objects.filter(pk=sent['tag']['id']).exists():
        previous_user = Tag.objects.get(pk=sent['tag']['id']).user
        Tag.objects.filter(pk=sent['tag']['id']).delete()
    
    object_type, _ = ObjectType.objects.get_or_create(name = sent['tag']['object']['name'], dataset=image.dataset)
    
    attributes_to_save = []
    for attribute in sent['tag']['object']['attributes']:
        attribute_type, _ = AttributeType.objects.get_or_create(name=attribute['name'], dataset=image.dataset)
        attribute_type_value, _ = AttributeTypeValue.objects.get_or_create(
            name=attribute['value'], 
            attribute_type=attribute_type
        )
        attributes_to_save.append(Attribute(value=attribute_type_value))
    
    tag = Tag()
    if previous_user is not None:
        # evita que o curador "tome posse" da tag
        tag.user = previous_user
    else:
        tag.user = request.user
    tag.x = sent['tag']['x']
    tag.y = sent['tag']['y']
    tag.width = sent['tag']['width']
    tag.height = sent['tag']['height']
    tag.image = image
    tag.object_type = object_type
    tag.date = timezone.now()
    tag.save()
    tag.attributes.add(*attributes_to_save, bulk=False)
    
    return JsonResponse({'id': tag.id})

@login_required_for_api
def post_save_relation(request):
    #deveriar copiar a tag inteira...
    
    sent = json.loads(request.body)
    
    relation_type, _ = RelationType.objects.get_or_create(
        name=sent['name'], 
        dataset=Tag.objects.get(pk=sent['originTagId']).image.dataset
    )
    
    relation, _ = Relation.objects.update_or_create(
        id=sent['id'],
        defaults={
            'relation_type': relation_type,
            'originTag': Tag.objects.get(pk=sent['originTagId']),
            'targetTag': Tag.objects.get(pk=sent['targetTagId'])
        })
    
    return JsonResponse({'id': relation.id})
    
# def add_users(request):
#     User.objects.all().delete()
    
#     User.objects.create_user('Daniel', 'daniel@colabdata.com', '1234')
#     User.objects.create_user('João', 'joaocarlos@colabdata.com', '1234')
#     User.objects.create_user('Fabrício', 'fabricio@colabdata.com', '1234')
#     User.objects.create_user('Gabriel', 'gabriel@colabdata.com', '1234')
#     return HttpResponse('Usuarios criados!')

# def add_images(request):
#     path = os.path.dirname(__file__)+"/static/tagged_images"
#     files = [f for f in listdir(path) if isfile(join(path, f))]
    
#     response = []
#     for file in files:
#         im = PILImage.open(join(path, file))
#         width, height = im.size
#         try:
#             image_data = ImageData.objects.get(address=file)
#             image_data.width = width
#             image_data.height = height
#             image_data.save()
#         except ImageData.DoesNotExist:
#             ImageData.objects.create(address = file, width = width, height = height)
        
#         #response.append((file, width, height))
    
#     for image_data in ImageData.objects.all():
#         if not image_data.address in files:
#             image_data.delete()
#             #response.append(image_data.address)
       
#     return HttpResponse("Imagens sincronizadas")

def post_login(request):
    sent = json.loads(request.body)
    
    username = sent['email']
    password = sent['senha']

    user = authenticate(username=username, password=password)
    
    if user is not None:
        login(request, user)
        return HttpResponse()
    else:
        return HttpResponse(status=400)

@login_required_for_api        
def post_logout(request):
    logout(request)
    
    return HttpResponse()