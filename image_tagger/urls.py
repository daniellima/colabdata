from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'), # this name 'index' must exist in order to generate correctly urls in angular app. See 'urls.js'
    url(r'^logout$', views.logout, name='logout'),
    url(r'^datasets$', views.datasets, name='datasets'),
    url(r'^private_datasets$', views.private_datasets, name='private_datasets'),
    url(r'^dataset/([0-9]+)/publications$', views.dataset_publications, name="dataset_publications"),
    url(r'^dataset/([0-9]+)/image_tagger$', views.dataset_image_tagger, name='dataset_image_tagger'),
    url(r'^dataset/([0-9]+)/images_pack$', views.images_pack, name='images_pack'),
    url(r'^dataset/([0-9]+)/onthology$', views.dataset_onthology, name='dataset_onthology'),
    url(r'^dataset/image/([0-9]+)$', views.image, name='image'),
    url(r'^save/tag$', views.save_tag, name='save_tag'),
    url(r'^delete/tag$', views.delete_tag, name='delete_tag'),
    url(r'^merge/tags$', views.merge_tags, name='merge_tags'),
    url(r'^save/relation$', views.save_relation, name='save_relation'),
    url(r'^delete/relation$', views.delete_relation, name='delete_relation'),
    url(r'^download/publication/(\d+)$', views.download_publication, name='download_publication')
]