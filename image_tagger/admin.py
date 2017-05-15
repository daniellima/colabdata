from django.contrib import admin
from django import forms
from .models import Image, Dataset, DatasetMembership, Publication, AttributeType, AttributeTypeValue, Attribute, ObjectType, Tag, RelationType, Relation
from django.contrib.auth.models import User, Group, Permission
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.db.models import Q
from django.conf import settings
from django.utils.safestring import mark_safe
from django.urls import reverse
from django.db.models import Count
import tarfile
import os
import shutil
import datetime
import json
import io
# Register your models here.

class DatasetMembershipInline(admin.StackedInline):
    model = DatasetMembership
    extra = 0
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        formfield = super(DatasetMembershipInline, self).formfield_for_foreignkey(db_field, request, **kwargs)
        
        if db_field.name == "user" and not request.user.is_superuser:
            formfield.queryset = formfield.queryset.filter(is_superuser=False)     
        if db_field.name == "group" and not request.user.is_superuser:
            formfield.queryset = Group.objects.exclude(name="Administrador")
             
        return formfield
    
    def get_queryset(self, request):
        qs = super(DatasetMembershipInline, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.exclude(Q(group__name="Administrador")|Q(user__is_superuser=True))
    
    def has_change_permission(self, request, obj=None):
        return True
        
    def has_add_permission(self, request, obj=None):
        return True
        
    def has_delete_permission(self, request, obj=None):
        return True

class AttributeValueInline(admin.StackedInline):
    model = AttributeTypeValue
    extra = 0
    
    def has_change_permission(self, request, obj=None):
        return True
        
    def has_add_permission(self, request, obj=None):
        return True
        
    def has_delete_permission(self, request, obj=None):
        return True

class DatasetAddForm(forms.ModelForm):
    import_file = forms.FileField(required=False, help_text="Um arquivo no formato tar.gz. O dataset será criado com os dados desse arquivo.")

class DatasetAdmin(admin.ModelAdmin):
    
    inlines = (DatasetMembershipInline,)
    actions = None
    
    def get_readonly_fields(self, request, obj=None):
        if obj is None:
            return []
        else:
            return ['link']
    
    def link(self, dataset):
        if dataset.has_no_publications():
            return "(não possui link pois não possui publicações)"
            
        link = reverse('dataset_publications', args=(dataset.id,))
        return mark_safe('<a href="{0}" target="_blank">Clique para ver as publicações</a>'.format(link))
        
    link.short_description = "Link para publicações"
    
    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            kwargs['form'] = DatasetAddForm
            
        return super(DatasetAdmin, self).get_form(request, obj, **kwargs)
    
    def save_model(self, request, obj, form, change):
        super(DatasetAdmin, self).save_model(request, obj, form, change)
        
        if not change:
            import_file = form.cleaned_data['import_file']
            if import_file is not None:
                # with open(settings.MEDIA_ROOT + import_file.name, 'wb+') as destination:
                #     for chunk in import_file.chunks():
                #         destination.write(chunk)
                try:
                    with tarfile.open(fileobj=import_file.file) as tar:
                        new_id_by_old_id = self.import_images(tar, obj, {})
                        new_id_by_old_id = self.import_model(tar, obj, "attribute_types.jsonl", AttributeType, new_id_by_old_id, request.user)
                        new_id_by_old_id = self.import_model(tar, obj, "attribute_type_values.jsonl", AttributeTypeValue, new_id_by_old_id, request.user)
                        new_id_by_old_id = self.import_model(tar, obj, "object_types.jsonl", ObjectType, new_id_by_old_id, request.user)
                        new_id_by_old_id = self.import_model(tar, obj, "tags.jsonl", Tag, new_id_by_old_id, request.user)
                        new_id_by_old_id = self.import_model(tar, obj, "attributes.jsonl", Attribute, new_id_by_old_id, request.user)
                        new_id_by_old_id = self.import_model(tar, obj, "relation_types.jsonl", RelationType, new_id_by_old_id, request.user)
                        self.import_model(tar, obj, "relations.jsonl", Relation, new_id_by_old_id, request.user)
                except (tarfile.TarError):
                    # TODO exploded. Do clean_up
                    raise

    # TODO mudar o nome de Model para modelClass
    def import_model(self, tar, obj, file_name, Model, new_id_by_old_id, user):
        file = tar.extractfile(file_name)
        if file is None: pass # TODO explode
        file = io.TextIOWrapper(file) # extractfile returns a byte reader
        for line in file:
            model_json = json.loads(line)
            model = Model.from_publication_json(model_json, obj, new_id_by_old_id, user)
            model.save()
            new_id_by_old_id[Model.__name__+str(model_json['id'])] = model.id
            
        return new_id_by_old_id
    
    def import_images(self, tar, obj, new_id_by_old_id):
        for member in tar.getmembers():
            if member.name.startswith("image") and member.isfile():
                image = Image()
                image.file.name = ""
                image.dataset = obj
                image.save() # get an id for the image
                
                image_id, image_extension = os.path.splitext(os.path.basename(member.name))
                image.file.name = str(obj.id) + "_" + str(image.id) + image_extension # make it unique
                image.save()
                
                new_id_by_old_id['Image'+str(image_id)] = image.id
                
                member.name = image.file.name
                extraction_path = settings.MEDIA_ROOT
                tar.extract(member, path=extraction_path)
        
        return new_id_by_old_id                
    
    def get_queryset(self, request):
        qs = super(DatasetAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return request.user.datasets.filter(datasetmembership__group__name="Administrador")
    
    def has_module_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        
        return DatasetMembership.objects.filter(user=request.user, group__name="Administrador", dataset=obj)
    
    def has_add_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
            
        return False
        
    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        
        return False

class CustomUserAdmin(UserAdmin):
    
    list_display = ('username', 'email', 'first_name', 'last_name', 'number_of_contributions') #, 'is_staff')
    list_filter = ('datasetmembership__group', 'datasetmembership__dataset', 'is_active')
    actions = None
    
    fieldsets = (
        (None, {'fields': ('username', 'password', 'is_active')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        #('Permissions', {'fields': ('is_active', 'user_permissions', 'groups')}), 
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    readonly_fields = ['date_joined', 'last_login']
    
    def number_of_contributions(self, obj):
        return  obj.number_of_contributions
    number_of_contributions.short_description = 'Contributions (# of Tags)'
    number_of_contributions.admin_order_field = 'number_of_contributions'
    
    def get_form(self, request, obj=None, **kwargs):
        
        form = super(CustomUserAdmin, self).get_form(request, obj, **kwargs)
        if obj == None or request.user.is_superuser:
            return form
        if obj.id == request.user.id: # is editing itself
            return form
        else:
            form.media = forms.Media(css={'all':('image_tagger/css/remove_save_buttons.css',)}, js=())
            return form
    
    def get_fieldsets(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return super(CustomUserAdmin, self).get_fieldsets(request, obj)
        if obj.id == request.user.id: # is editing itself
            return super(CustomUserAdmin, self).get_fieldsets(request, obj)
        else:
            return (
                (None, {'fields': ('username',)}),
                ('Personal info', {'fields': ('first_name', 'last_name', 'email')})
            )
    
    def get_readonly_fields(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return super(CustomUserAdmin, self).get_readonly_fields(request, obj)
        if obj.id == request.user.id: # is editing itself
            return super(CustomUserAdmin, self).get_readonly_fields(request, obj)
        else:
            return super(CustomUserAdmin, self).get_readonly_fields(request, obj) + ['username', 'first_name', 'last_name', 'email']
    
    def get_queryset(self, request):
        qs = super(CustomUserAdmin, self).get_queryset(request)
        
        # adiciona contagem de contibuições para que isso possa ser mostrado na 
        # lista de usuarios do admin
        qs = qs.annotate(number_of_contributions=Count('tags', distinct=True))
        
        if request.user.is_superuser:
            return qs
        
        return qs.filter(is_superuser=False)
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.is_staff = True
        
        super(CustomUserAdmin, self).save_model(request, obj, form, change)
        
        # add delete permissions because the delete confirmation page
        # ignores the has_delete_permission methods
        delete_permissions = Permission.objects.filter(codename__in=['delete_image', 'delete_attributetype', 'delete_objecttype', 'delete_relationtype', 'delete_publication'])
        obj.user_permissions.set(delete_permissions)
    
    def has_module_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        # if obj == None or request.user.is_superuser:
        #     return True
        # if obj.id == request.user.id: # is editing itself
        #     return True
        
        # return False
        return True
    
    def has_add_permission(self, request, obj=None):
        return True
        
    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        
        return False
    
class ImageAdmin(admin.ModelAdmin):
    
    list_filter = [('dataset', admin.RelatedOnlyFieldListFilter)]
    actions = None
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "dataset" and not request.user.is_superuser:
            kwargs["queryset"] = request.user.datasets.filter(datasetmembership__group__name="Administrador")
            
        return super(ImageAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)
    
    def get_queryset(self, request):
        qs = super(ImageAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(dataset__in=request.user.datasets.filter(datasetmembership__group__name="Administrador"))
    
    def has_module_permission(self, request):
        return True
    
    def has_add_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")
        
    def has_delete_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")

class ObjectTypeAdmin(admin.ModelAdmin):
    
    list_filter = [('dataset', admin.RelatedOnlyFieldListFilter)]
    actions = None
    
    def get_readonly_fields(self, request, obj=None):
        if obj is None:
            return []
        else:
            return ['dataset']
    
    def get_queryset(self, request):
        qs = super(ObjectTypeAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(dataset__in=request.user.datasets.filter(datasetmembership__group__name="Administrador"))
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "dataset" and not request.user.is_superuser:
            kwargs["queryset"] = request.user.datasets.filter(datasetmembership__group__name="Administrador")
            
        return super(ObjectTypeAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)
    
    def has_module_permission(self, request):
        return True
    
    def has_add_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")
        
    def has_delete_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")

class AttributeTypeAdmin(admin.ModelAdmin):
    
    inlines = [AttributeValueInline]
    list_filter = [('dataset', admin.RelatedOnlyFieldListFilter)]
    
    actions = None
    
    def get_readonly_fields(self, request, obj=None):
        if obj is None:
            return []
        else:
            return ['dataset']
    
    def get_queryset(self, request):
        qs = super(AttributeTypeAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(dataset__in=request.user.datasets.filter(datasetmembership__group__name="Administrador"))
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "dataset" and not request.user.is_superuser:
            kwargs["queryset"] = request.user.datasets.filter(datasetmembership__group__name="Administrador")
            
        return super(AttributeTypeAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)
    
    def has_module_permission(self, request):
        return True
    
    def has_add_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")
        
    def has_delete_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")

class RelationTypeAdmin(admin.ModelAdmin):
    
    list_filter = [('dataset', admin.RelatedOnlyFieldListFilter)]
    actions = None
    
    def get_readonly_fields(self, request, obj=None):
        if obj is None:
            return []
        else:
            return ['dataset']
    
    def get_queryset(self, request):
        qs = super(RelationTypeAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(dataset__in=request.user.datasets.filter(datasetmembership__group__name="Administrador"))
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "dataset" and not request.user.is_superuser:
            kwargs["queryset"] = request.user.datasets.filter(datasetmembership__group__name="Administrador")
            
        return super(RelationTypeAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)
    
    def has_module_permission(self, request):
        return True
    
    def has_add_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")
        
    def has_delete_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")

class PublicationAdmin(admin.ModelAdmin):
    
    list_display = ['name', 'get_short_description', 'export_date']
    list_filter = [('dataset', admin.RelatedOnlyFieldListFilter)]
    # see here http://stackoverflow.com/questions/1471909/django-model-delete-not-triggered?noredirect=1&lq=1
    actions = None
    
    readonly_fields = ('export_date',)
    
    def get_short_description(self, obj):
        words = obj.description.split(' ')
        short_description = ' '.join(words[:10])
        if len(words) > 10:
            short_description += '...'
        return  short_description
    get_short_description.short_description = 'Description'
    
    def get_fields(self, request, obj=None):
        fields = super(PublicationAdmin, self).get_fields(request, obj)
        
        if obj is None:
            fields.remove("export_date")

        return fields
        
    def get_readonly_fields(self, request, obj=None):
        fields = super(PublicationAdmin, self).get_readonly_fields(request, obj)
        
        if obj is not None:
            return fields + ("dataset",)

        return fields
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.export_date = datetime.datetime.now()
            
        super(PublicationAdmin, self).save_model(request, obj, form, change)
        
        if not change:
            try:
                temp_directory = os.path.join(Publication.STORAGE_DIRECTORY, "temp_{0}".format(obj.id))
                os.mkdir(temp_directory)
                
                obj.publish(temp_directory, Publication.STORAGE_DIRECTORY)
            except:
                # TODO show message to user that something exploded
                raise
            finally:
                shutil.rmtree(temp_directory)
    
    def get_queryset(self, request):
        qs = super(PublicationAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(dataset__in=request.user.datasets.filter(datasetmembership__group__name="Administrador"))
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "dataset" and not request.user.is_superuser:
            kwargs["queryset"] = request.user.datasets.filter(datasetmembership__group__name="Administrador")
            
        return super(PublicationAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)
    
    def has_module_permission(self, request):
        return True
    
    def has_add_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")
        
    def has_delete_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")
    
    def has_change_permission(self, request, obj=None):
        if obj == None or request.user.is_superuser:
            return True
        else:
            return obj.dataset in request.user.datasets.filter(datasetmembership__group__name="Administrador")

class CustomAdminSite(admin.AdminSite):
    site_title = 'Colabdata Administration'
    index_title = 'Home'
    
    def has_permission(self, request):
        if request.user.is_superuser: 
            return True
        if not request.user.is_active:
            return False
        return request.user.datasets.filter(datasetmembership__group__name="Administrador").exists()

custom_admin_site = CustomAdminSite(name="custom_admin")

custom_admin_site.register(User, CustomUserAdmin)
custom_admin_site.register(Dataset, DatasetAdmin)
custom_admin_site.register(Publication, PublicationAdmin)
custom_admin_site.register(Image, ImageAdmin)
custom_admin_site.register(ObjectType, ObjectTypeAdmin)
custom_admin_site.register(RelationType, RelationTypeAdmin)
custom_admin_site.register(AttributeType, AttributeTypeAdmin)
