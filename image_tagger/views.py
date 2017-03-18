# encoding: utf-8
from .models import Tag, ObjectType, AttributeType, AttributeTypeValue, Attribute, Image, Relation, RelationType, DatasetMembership, Dataset
from django.utils import timezone
from django.http import Http404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.contrib.staticfiles.templatetags.staticfiles import static
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django import forms
from .decorators import ajax_aware_login_required
from django.db.models import Count
import json
import os
from os import listdir
from os.path import isfile, join
from django.core.exceptions import ObjectDoesNotExist

def get_json(request):
    return json.loads(request.body.decode('utf-8'))

def is_curator(user, dataset):
    return DatasetMembership.objects.filter(user=user, dataset=dataset, group__name__in=["Curador","Administrador"]).exists()

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
    datasets = user.datasets.all()
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
    sent = get_json(request)
    
    id = sent['id']

    relation = Relation.objects.get(pk=id)
    
    relation.delete()
    
    return HttpResponse()

# TODO: deletar
@require_POST
@ajax_aware_login_required
def logout(request):
    auth.logout(request)
    
    return HttpResponse()
    
@require_GET
def dataset_publications(request, dataset_id):
    try:
        dataset = Dataset.objects_with_publications().get(pk=dataset_id)
        publications = dataset.publications.order_by('-export_date')
    except ObjectDoesNotExist:
        raise Http404("Dataset does not exist or has no publications.")
        
    return render(request, 'image_tagger/dataset_publications.html', {
        'dataset':dataset, 
        'publications':publications,
        'should_go_back_to_private_datasets': 'from_private' in request.GET
    })
    
@require_GET
def datasets(request):
    datasets = Dataset.objects_with_publications().order_by('name')
    return render(request, 'image_tagger/datasets.html', {'datasets': datasets})

class LoginForm(forms.Form):
    username = forms.CharField()
    password = forms.CharField()

@require_http_methods(['GET', 'POST', 'HEAD'])
def index(request):
    
    if request.method == 'POST':
        form = LoginForm(request.POST)
        
        if form.is_valid():
            
            user = auth.authenticate(username=request.POST['username'], password=request.POST['password'])
            if user is not None:
                auth.login(request, user)
                return redirect('index')
            
            form.add_error(None, "Your credentials are not valid.")
    else:
        form = LoginForm()
        
    return render(request, 'image_tagger/index.html', {'form' : form})

@require_POST
@login_required
def logout(request):
    auth.logout(request)
    
    return redirect('index')
    
@require_GET
@login_required
def private_datasets(request):
    datasets = Dataset.objects.filter(datasetmembership__user=request.user).order_by('name')
    datasets_with_images = [(dataset, dataset.get_example_images(3)) for dataset in datasets]
    return render(request, 'image_tagger/private_datasets.html', {'datasets_with_images': datasets_with_images})
    
@require_GET
@login_required
def image(request, index):
    index = int(index)
    
    image = Image.objects.raw("""
        SELECT image.id AS id, image.dataset_id AS dataset_id, image.file AS file, COUNT(tag.id) AS c1, -1 as c2
        FROM image_tagger_image AS image
        LEFT JOIN image_tagger_tag AS tag ON tag.image_id = image.id
        WHERE image.dataset_id = %s
        GROUP BY image.id
        HAVING c1 < 3
        UNION
        SELECT image.id, image.dataset_id, image.file, -1 as c1, COUNT(tag.id) AS c2
        FROM image_tagger_image AS image
        LEFT JOIN image_tagger_tag AS tag ON tag.image_id = image.id
        WHERE image.dataset_id = %s
        GROUP BY image.id
        HAVING c2 >= 3
        ORDER BY c1 DESC, c2 ASC
        LIMIT 1 OFFSET %s""", [39, 39, index])[0]
    num_of_images = Image.objects.filter(dataset_id=39).count()
    has_next_image = (index != num_of_images-1)
    return JsonResponse({
        'image': image.toJSONSerializable(only_tags_from_user=request.user),
        'has_next_image': has_next_image
    })