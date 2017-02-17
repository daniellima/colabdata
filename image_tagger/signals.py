from django.db.models.signals import pre_delete
from django.dispatch import receiver
from .models import Image, Publication
import os
from django.conf import settings

@receiver(pre_delete, sender=Image, weak=False)
def delete_file_from_image(sender, **kwargs):
    instance = kwargs['instance']
    try:
        instance.file.delete()
    except Exception as ex:
        raise Exception("Error when deleting the file {} from image {} of dataset {}(id: {}).".format(
            instance.file.name,
            instance.id,
            instance.dataset.name,
            instance.dataset.id)) from ex

@receiver(pre_delete, sender=Publication, weak=False)
def delete_file_from_publication(sender, **kwargs):
    instance = kwargs['instance']
    try:
        raise Exception('oi')
        # TODO remove this hardcoded reference
        publication_directory = "{0}publications/".format(settings.MEDIA_ROOT)
        file_path = publication_directory + instance.get_file_name()
        os.remove(file_path)
    except Exception as ex:
        raise Exception("Error when deleting the file {} from publication {} of dataset {}(id: {}).".format(
            instance.get_file_name(),
            instance.id,
            instance.dataset.name,
            instance.dataset.id)) from ex