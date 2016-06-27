from django.http import JsonResponse, HttpResponse
from models import ImageData, Tag, Objeto, Attribute, Relation
from django.contrib.staticfiles.templatetags.staticfiles import static
import json

# Create your views here.

def get_all(request):
    
    images = ImageData.objects.all()

    data = map(lambda image: {
        'id': image.id,
        'url': static('tagged_images/' + image.address),
        'width': image.width,
        'height': image.height,
        'blocks': [tag.toJSONSerializable() for tag in image.tags.all()]
    }, images)
    
    return JsonResponse({'images': data})

def post_save_tag(request):
    
    sent = json.loads(request.body)
    image_data = ImageData.objects.get(pk=sent['imageId'])
    
    if Tag.objects.filter(pk=sent['tag']['id']).exists():
        Tag.objects.filter(pk=sent['tag']['id']).delete()
    
    object = Objeto.objects.create(name = sent['tag']['object']['name'])
    
    for attribute in sent['tag']['object']['attributes']:
        Attribute.objects.create(name=attribute['name'], value=attribute['value'], object=object)
    
    tag = Tag()
    tag.x = sent['tag']['x']
    tag.y = sent['tag']['y']
    tag.width = sent['tag']['width']
    tag.height = sent['tag']['height']
    tag.image_data = image_data
    tag.object = object
    tag.save()
    
    return JsonResponse({'id': tag.id})
    
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