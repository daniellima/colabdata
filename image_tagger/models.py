from django.contrib.auth.models import User, Group
from django.db import models
import shutil
import json
import os
import datetime
from collections import OrderedDict
import tarfile
from django.db.models import Count
from django.conf import settings
import uuid
from django.core.validators import MinValueValidator
# Create your models here.

class Dataset(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(max_length=5000)
    users = models.ManyToManyField(User, related_name='datasets', through='DatasetMembership')
    fixed_types = models.BooleanField(default=False, help_text="Determines whether contributors can create new types (object, relationships, etc.) or not. If set to true, only object types, attribute types, attribute value types, and relationship types defined in the system can be used.")
    public = models.BooleanField(default=False, help_text="Determines whether the publications of this dataset will be available to non logged users or not. If set to true, anyone will be able to download publications of this dataset from the public datasets area.")
    desired_number_of_contributions = models.IntegerField(default=3, validators=[MinValueValidator(2)], help_text="Determines the number of users who should contribute an image before the system stops showing it with priority. Please note that this value should not be greater than the number of contributors in this dataset. If you don't know what this value means, better to leave it at the default value of 3.")
    
    @staticmethod
    def objects_with_publications():
        return Dataset.objects.annotate(number_of_publications=Count('publications')).filter(number_of_publications__gt=0)
    
    def get_admin_url(self):
        """the url to the Django admin interface for the model instance"""
        from django.core.urlresolvers import reverse
        info = (self._meta.app_label, self._meta.model_name)
        return reverse('admin:%s_%s_change' % info, args=(self.pk,))
    
    def has_no_publications(self):
        return len(self.publications.all()) == 0
    
    def get_example_images(self, how_many):
        return self.images.order_by('id').all()[:how_many] # order by id only to avoid having an undetermined order
    
    def __str__(self):
        return self.name

class DatasetMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'dataset')
        
class ObjectType(models.Model):
    name = models.CharField(max_length=255)
    dataset = models.ForeignKey(Dataset, related_name="object_types", on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('name', 'dataset')
    
    @staticmethod
    def from_publication_json(json, dataset, new_id_by_old_id, user):
        return ObjectType(name=json['name'], dataset=dataset)
    
    def to_publication_json(self):
        return {
            'id': self.id,
            'name': self.name
        }
        
    def __str__(self):
        return self.name

class AttributeType(models.Model):
    name = models.CharField(max_length=255)
    dataset = models.ForeignKey(Dataset, related_name="attribute_types", on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('name', 'dataset')
    
    def to_publication_json(self):
        return {
            'id': self.id,
            'name': self.name
        }
    
    @staticmethod
    def from_publication_json(json, dataset, new_id_by_old_id, user):
        return AttributeType(name=json['name'], dataset=dataset)
    
    def toJSONSerializable(self):
        return {'name': self.name, 'value': self.value}
        
    def __str__(self):
        return self.name

class AttributeTypeValue(models.Model):
    name = models.CharField(max_length=255)
    attribute_type = models.ForeignKey(AttributeType, related_name="values", on_delete=models.CASCADE)

    class Meta:
        unique_together = ('name', 'attribute_type')

    @staticmethod
    def from_publication_json(json, dataset, new_id_by_old_id, user):
        atid = new_id_by_old_id["AttributeType"+str(json['attribute_type_id'])]
        return AttributeTypeValue(name=json['name'], attribute_type_id=atid)

    def to_publication_json(self):
        return {
            'id': self.id,
            'name': self.name,
            'attribute_type_id': self.attribute_type.id
        }
        
    def __str__(self):
        return self.name

class RelationType(models.Model):
    name = models.CharField(max_length=255)
    dataset = models.ForeignKey(Dataset, related_name="relation_types", on_delete=models.CASCADE)

    class Meta:
        unique_together = ('name', 'dataset')

    @staticmethod
    def from_publication_json(json, dataset, new_id_by_old_id, user):
        return RelationType(name=json['name'], dataset=dataset)

    def to_publication_json(self):
        return {
            'id': self.id,
            'name': self.name
        }
    
    def __str__(self):
        return self.name

def generate_unique_hard_to_guess_name(image, filename):
    ext = filename.split('.')[-1]
    filename = "{}.{}".format(uuid.uuid4(), ext)
    return os.path.join('images/', filename)

class Image(models.Model):
    file = models.ImageField(upload_to=generate_unique_hard_to_guess_name)
    dataset = models.ForeignKey(Dataset, related_name="images", on_delete=models.CASCADE)

    def get_publication_name(self):
        id = self.id
        extension = os.path.splitext(self.file.name)[1]
        return "{0}{1}".format(id, extension)
        
    def toJSONSerializable(self, only_tags_from_user=None):
        
        if only_tags_from_user is not None:
            tags = self.tags.filter(user=only_tags_from_user)
        else:
            tags = self.tags.all()
            
        return {
            'id': self.id,
            'url': self.file.url,
            'width': self.file.width,
            'height': self.file.height,
            'tags': [tag.toJSONSerializable() for tag in tags]
        }
        
    def __str__(self):
        return "{}".format(self.id)
 
class Tag(models.Model):
    object_type = models.ForeignKey(ObjectType, related_name="tags", on_delete=models.CASCADE)
    x = models.IntegerField()
    y = models.IntegerField()
    width = models.IntegerField()
    height = models.IntegerField()
    user = models.ForeignKey(User, related_name="tags", on_delete=models.CASCADE)
    image = models.ForeignKey(Image, related_name="tags", on_delete=models.CASCADE)
    date = models.DateTimeField()
    
    @staticmethod
    def from_publication_json(json, dataset, new_id_by_old_id, user):
        return Tag(
            image_id=new_id_by_old_id['Image'+str(json['image_id'])],
            object_type_id=new_id_by_old_id['ObjectType'+str(json['object_type_id'])],
            x=json['x'],
            y=json['y'],
            width=json['width'],
            height=json['height'],
            date=datetime.datetime.now(),
            user=user
            )
    
    def to_publication_json(self):
        return {
            'id': self.id,
            'image_id': self.image.id,
            'object_type_id': self.object_type.id,
            'x': self.x,
            'y': self.y,
            'width': self.width,
            'height': self.height,
        }
    
    def toJSONSerializable(self):
        return {
            'id': self.id,
            'x': self.x,
            'y': self.y,
            'width': self.width,
            'height': self.height,
            'object': self.object_type.name,
            'attributes': [attribute.toJSONSerializable() for attribute in self.attributes.all()],
            'relations': [relation.toJSONSerializable() for relation in self.relatedToRelations.all()]
        }

class Attribute(models.Model):
    value = models.ForeignKey(AttributeTypeValue, related_name="attributes", on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, related_name="attributes", on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('value', 'tag')
    
    @staticmethod
    def from_publication_json(json, dataset, new_id_by_old_id, user):
        return Attribute(
            tag_id=new_id_by_old_id['Tag'+str(json['tag_id'])],
            value_id=new_id_by_old_id['AttributeTypeValue'+str(json['attribute_type_value_id'])]
            )
    
    def to_publication_json(self):
        return {
            'id': self.id,
            'attribute_type_value_id': self.value.id,
            'tag_id': self.tag.id
        }
    
    def toJSONSerializable(self):
        return {'name': self.value.attribute_type.name, 'value': self.value.name}

class Relation(models.Model):
    relation_type = models.ForeignKey(RelationType, related_name="relations", on_delete=models.CASCADE)
    # TODO padrão python...
    originTag = models.ForeignKey(Tag, related_name='relatedToRelations', on_delete=models.CASCADE)
    targetTag = models.ForeignKey(Tag, related_name='relatedFromRelations', on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('relation_type', 'originTag', 'targetTag')
    
    @staticmethod
    def from_publication_json(json, dataset, new_id_by_old_id, user):
        return Relation(
            relation_type_id=new_id_by_old_id['RelationType'+str(json['relation_type_id'])],
            originTag_id=new_id_by_old_id['Tag'+str(json['tag1'])],
            targetTag_id=new_id_by_old_id['Tag'+str(json['tag2'])]
            )
    
    def to_publication_json(self):
        return {
            'id': self.id,
            'relation_type_id': self.relation_type_id,
            'tag1': self.originTag.id,
            'tag2': self.targetTag.id
        }
    
    def toJSONSerializable(self):
        return OrderedDict({
            'id': self.id,
            'name': self.relation_type.name,
            'originTagId': self.originTag.id, 
            'targetTagId': self.targetTag.id
        })

class Publication(models.Model):
    dataset = models.ForeignKey(Dataset, related_name="publications", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(max_length=2000)
    export_date = models.DateTimeField()
    
    STORAGE_DIRECTORY = os.path.join(settings.BASE_DIR, 'private_media', 'publications')
    
    def publish(self, temp_directory, publication_directory):
        self.export_to_json(os.path.join(temp_directory, "tags.jsonl"), Tag.objects.filter(image__in=self.dataset.images.all()).all())
        self.export_to_json(os.path.join(temp_directory, "object_types.jsonl"), self.dataset.object_types.all())
        self.export_to_json(os.path.join(temp_directory, "relation_types.jsonl"), self.dataset.relation_types.all())
        self.export_to_json(os.path.join(temp_directory, "relations.jsonl"), Relation.objects.filter(relation_type__in=self.dataset.relation_types.all()).all())
        self.export_to_json(os.path.join(temp_directory, "attribute_types.jsonl"), self.dataset.attribute_types.all())
        self.export_to_json(os.path.join(temp_directory, "attribute_type_values.jsonl"), AttributeTypeValue.objects.filter(attribute_type__in=self.dataset.attribute_types.all()).all())
        self.export_to_json(os.path.join(temp_directory, "attributes.jsonl"), Attribute.objects.filter(tag__image__in=self.dataset.images.all()).all())
        self.create_compressed_file(temp_directory, publication_directory)
    
    def add_images_to_tar(self, tar):
        images_query = self.dataset.images.all()
        image_buffer_size = 10 # pega images de 10 em 10
        
        for i in range(0, images_query.count(), image_buffer_size):
            images = images_query[i:i+image_buffer_size]
            for image in images:
                tar.add(image.file.path, "image/{0}".format(image.get_publication_name()))
    
    def export_to_json(self, file, query):
        buffer_size = 10
        
        with open(file, 'w+', encoding='utf-8') as file_handler:
            for i in range(0, query.count(), buffer_size):
                objects = query[i:i+buffer_size]
                for object in objects:
                    json.dump(object.to_publication_json(), file_handler)
                    file_handler.write('\n')

    def create_compressed_file(self, temp_directory, publication_directory):
        def clean(tarinfo):
            # remove directory prefix from name.
            # temp_directory[1:] is used because the tarinfo name does not begin with "/" on it
            tarinfo.name = tarinfo.name.replace(temp_directory[1:]+'/', "") 
            
            # remove info about the environment where the file has been created
            tarinfo.uid = tarinfo.gid = 0
            tarinfo.uname = tarinfo.gname = "user"
            
            return tarinfo
        
        file_path = os.path.join(publication_directory, self.get_file_name())
        with tarfile.open(file_path, "w:gz") as tar:
            for entry in os.listdir(temp_directory):
                tar.add(os.path.join(temp_directory, entry), filter=clean)
                
            self.add_images_to_tar(tar)
    
    def get_file_name(self):
        return "published_dataset_{0}.tar.gz".format(self.id)

    def __str__(self):
        return self.name

# TODO consigo remover?
from . import signals