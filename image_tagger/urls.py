from django.conf.urls import url

from . import views

urlpatterns = [
    url(r'^all$', views.get_all, name='get_all'),
    url(r'^save/tag$', views.post_save_tag, name='post_save_tag'),
    url(r'^save/relation$', views.post_save_relation, name='post_save_relation')
]