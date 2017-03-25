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
from django.db.models import Count, Case, When, IntegerField, Max, Sum
import json
import os
import random
from os import listdir
from os.path import isfile, join
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied

def get_json(request):
    return json.loads(request.body.decode('utf-8'))

def is_curator(user, dataset):
    return DatasetMembership.objects.filter(user=user, dataset=dataset, group__name__in=["Curador","Administrador"]).exists()

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
                
                return redirect('private_datasets')
            
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
    datasets_with_info = [(dataset, is_curator(request.user, dataset), dataset.get_example_images(3)) for dataset in datasets]
    return render(request, 'image_tagger/private_datasets.html', {
        'datasets_with_info': datasets_with_info
    })
    
@require_GET
@login_required # TODO ajax_aware_login_required
def image(request, dataset_id, image_id):
    if not request.user.datasets.filter(pk=dataset_id).exists():
        raise PermissionDenied

    dataset = Dataset.objects.get(pk=dataset_id)
    
    image = Image.objects.get(pk=image_id)
    
    if is_curator(request.user, dataset):
        image = image.toJSONSerializable()
    else:
        image = image.toJSONSerializable(only_tags_from_user=request.user)

    return JsonResponse({
        'image': image,
    })

@require_GET
@ajax_aware_login_required
def images_pack(request, dataset_id):
    PACK_SIZE = 15
    
    if not request.user.datasets.filter(pk=dataset_id).exists():
        raise PermissionDenied
    
    dataset = Dataset.objects.get(pk=dataset_id)
    
    if is_curator(request.user, dataset):
        ids = Image.objects.annotate(num_tags=Count('tags')).filter(num_tags__gt=0, dataset=dataset).order_by('id').values_list('id', flat=True)
        ids = list(ids)
        if len(ids) > PACK_SIZE:
            ids = random.sample(ids, PACK_SIZE)
        images = Image.objects.filter(id__in=ids)
    else:
        num_images_to_contribute_to = Image.objects.annotate(contributed_by_user=Sum(
            Case(
                When(tags__user=request.user, then=1),
                default=0,
                output_field=IntegerField()
        ))).filter(dataset=dataset, contributed_by_user=0).count()
        if num_images_to_contribute_to > 0:
            images = Image.objects \
                .annotate(contributions=Count('tags__user', distinct=True)) \
                .annotate(user_contributed=Max(Case(When(tags__user=request.user, then=1), default=0, output_field=IntegerField()))) \
                .filter(user_contributed=0, dataset=dataset) \
                .order_by(Case(When(contributions__lte=3, then='contributions')).desc(), Case(When(contributions__gt=3, then='contributions')).asc()) \
                [:PACK_SIZE]
        else:
            ids = Image.objects.filter(dataset=dataset).order_by('id').values_list('id', flat=True)
            ids = list(ids)
            if len(ids) > PACK_SIZE:
                ids = random.sample(ids, PACK_SIZE)
            images = Image.objects.filter(id__in=ids)

    image_ids = [image.id for image in images]
    
    return JsonResponse({'images': image_ids})

@require_GET
@login_required
def dataset_image_tagger(request, dataset_id):
    if not request.user.datasets.filter(pk=dataset_id).exists():
        raise PermissionDenied
    
    dataset = Dataset.objects.get(pk=dataset_id)
    
    if is_curator(request.user, dataset):
        user_is_curator = 'true'
    else:
        user_is_curator = 'false'
    
    return render(request, 'image_tagger/dataset_image_tagger.html', {
        'user_is_curator': user_is_curator
    })