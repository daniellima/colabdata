from __future__ import unicode_literals
from django.contrib.auth.models import User, Group
from django.db import models

# Create your models here.

class Dataset(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(max_length=5000)
    users = models.ManyToManyField(User, related_name='datasets', through='DatasetMembership')
    
    def __str__(self):
        return self.name

class DatasetMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    
    def save(self, *args, **kwargs):
        super(DatasetMembership, self).save(*args, **kwargs)
        
        if self.group.name == "Administrador":
            self.user.is_staff = True
            self.user.save()
        else:
            if not self.user.datasets.filter(datasetmembership__group__name="Administrador").exists():
                self.user.is_staff = False
                self.user.save()


class ObjectType(models.Model):
    name = models.CharField(max_length=255)
    dataset = models.ForeignKey(Dataset, related_name="objects", on_delete=models.CASCADE)
    
class AttributeType(models.Model):
    name = models.CharField(max_length=255)
    dataset = models.ForeignKey(Dataset, related_name="attributes", on_delete=models.CASCADE)
    
    def toJSONSerializable(self):
        return {'name': self.name, 'value': self.value}

class AttributeTypeValue(models.Model):
    name = models.CharField(max_length=255)
    attribute_type = models.ForeignKey(AttributeType, related_name="values", on_delete=models.CASCADE)

class RelationType(models.Model):
    name = models.CharField(max_length=255)
    dataset = models.ForeignKey(Dataset, related_name="relations", on_delete=models.CASCADE)

class Image(models.Model):
    file = models.ImageField()
    dataset = models.ForeignKey(Dataset, related_name="images", on_delete=models.CASCADE)

class Tag(models.Model):
    object_type = models.ForeignKey(ObjectType, related_name="tags", on_delete=models.CASCADE)
    x = models.IntegerField()
    y = models.IntegerField()
    width = models.IntegerField()
    height = models.IntegerField()
    user = models.ForeignKey(User, related_name="tags", on_delete=models.CASCADE)
    image = models.ForeignKey(Image, related_name="tags", on_delete=models.CASCADE)
    date = models.DateTimeField()
    
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
    
    def toJSONSerializable(self):
        return {'name': self.value.attribute_type.name, 'value': self.value.name}

class Relation(models.Model):
    relation_type = models.ForeignKey(RelationType, related_name="relations", on_delete=models.CASCADE)
    originTag = models.ForeignKey(Tag, related_name='relatedToRelations', on_delete=models.CASCADE)
    targetTag = models.ForeignKey(Tag, related_name='relatedFromRelations', on_delete=models.CASCADE)
    
    def toJSONSerializable(self):
        return {
            'id': self.id,
            'name': self.relation_type.name,
            'originTagId': self.originTag.id, 
            'targetTagId': self.targetTag.id
        }
