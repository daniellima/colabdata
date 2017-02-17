# encoding: utf-8
from .models import Tag, ObjectType, AttributeType, AttributeTypeValue, Attribute, Image, Relation, RelationType, DatasetMembership
from django.utils import timezone
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET, require_POST
from django.contrib.staticfiles.templatetags.staticfiles import static
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from .decorators import ajax_aware_login_required
from django.db.models import Count
import json
import os
from os import listdir
from os.path import isfile, join

def get_json(request):
    return json.loads(request.body.decode('utf-8'))

def is_curator(user, dataset):
    return DatasetMembership.objects.filter(user=user, dataset=dataset, group__name="Curador").exists()

@require_POST
def login(request):
    sent = get_json(request)
    
    username = sent['email']
    password = sent['senha']

    user = auth.authenticate(username=username, password=password)
    
    if user is not None:
        auth.login(request, user)
        return HttpResponse()
    else:
        return HttpResponse(status=400)

@require_GET
@ajax_aware_login_required
def all(request):
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

@require_POST
@ajax_aware_login_required
def save_tag(request):
    
    sent = get_json(request)
    image = Image.objects.get(pk=sent['imageId'])

    if Tag.objects.filter(pk=sent['tag']['id']).exists():
        tag = Tag.objects.get(pk=sent['tag']['id'])
        # TODO não precisar deletar tudo antes
        tag.attributes.all().delete()
    else:
        tag = Tag()
        tag.user = request.user
    
    object_type, _ = ObjectType.objects.get_or_create(name = sent['tag']['object']['name'], dataset=image.dataset)
    
    attributes_to_save = []
    for attribute in sent['tag']['object']['attributes']:
        attribute_type, _ = AttributeType.objects.get_or_create(name=attribute['name'], dataset=image.dataset)
        attribute_type_value, _ = AttributeTypeValue.objects.get_or_create(
            name=attribute['value'], 
            attribute_type=attribute_type
        )
        attributes_to_save.append(Attribute(value=attribute_type_value))
    
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

@require_POST
@ajax_aware_login_required
def save_relation(request):
    sent = get_json(request)
    
    relation_type, _ = RelationType.objects.get_or_create(
        name=sent['name'], 
        dataset=Tag.objects.get(pk=sent['originTagId']).image.dataset
    )

    relation, _ = Relation.objects.update_or_create(
        id=sent['id'], # id será None quando uma nova Relation for criada
        defaults={
            'relation_type': relation_type,
            'originTag': Tag.objects.get(pk=sent['originTagId']),
            'targetTag': Tag.objects.get(pk=sent['targetTagId'])
        })
    
    return JsonResponse({'id': relation.id})
  
@require_POST
@ajax_aware_login_required     
def delete_tag(request):
    sent = get_json(request)
    
    id = sent['id']

    tag = Tag.objects.get(pk=id)
    
    tag.attributes.all().delete()
    tag.delete()
    
    return HttpResponse()

@require_POST
@ajax_aware_login_required
def delete_relation(request):
    sent = json.loads(request.body)
    
    id = sent['id']

    relation = Relation.objects.get(pk=id)
    
    relation.delete()
    
    return HttpResponse()

@require_POST
@ajax_aware_login_required        
def logout(request):
    auth.logout(request)
    
    return HttpResponse()