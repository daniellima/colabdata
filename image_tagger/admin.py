from django.contrib import admin
from .models import ImageData
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.db.models.signals import post_save
from django.db.models import Q
# Register your models here.

#admin.site.register(ImageData)

def define_staff_status(sender, **kwargs):

    if(kwargs['created']):
        saved_user = kwargs['instance']
        # preciso fazer manualmente porque chamar save vai chamar o signal novamente...
        User.objects.filter(id=saved_user.id).update(is_staff=False)
        group = Group.objects.get(name="Colaborador")
        saved_user.groups.add(group)

post_save.connect(define_staff_status, weak=False, sender=User, dispatch_uid="unique_id")

class CustomUserChangeForm(UserChangeForm):
        
    def save(self, commit=True):
        user = super(CustomUserChangeForm, self).save(commit=False)
        
        groups = map(lambda g: g.name, self.cleaned_data['groups'])
        if "Administrador" in groups:
            user.is_staff = True
        else:
            user.is_staff = False
        
        if commit:
            user.save()
        
        return user
        
class CustomUserChangeFormWhenAdminIsEditingItself(UserChangeForm):
    
    def save(self, commit=True):
        user = super(CustomUserChangeFormWhenAdminIsEditingItself, self).save(commit=False)
        
        if commit:
            user.save()
            self.save_m2m()
            administradorGroup = Group.objects.get(name="Administrador")
            user.groups.add(administradorGroup)
        else:
            
            old_save_m2m = self.save_m2m
            def custom_save_m2m():
                old_save_m2m()
                administradorGroup = Group.objects.get(name="Administrador")
                user.groups.add(administradorGroup)
            self.save_m2m = custom_save_m2m
        
        return user
    

class CustomUserAdmin(UserAdmin):
    
    form = CustomUserChangeForm
    
    list_display = ('username', 'email', 'first_name', 'last_name')
    list_filter = ('is_active', 'groups')
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active',
                                       'groups',)}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    readonly_fields = ['date_joined', 'last_login']
    
    def get_queryset(self, request):
        qs = super(CustomUserAdmin, self).get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(is_superuser=False).filter(~Q(groups__name="Administrador") | Q(id=request.user.id))
    
    def formfield_for_manytomany(self, db_field, request, **kwargs):
        formfield = super(CustomUserAdmin, self).formfield_for_manytomany(db_field, request, **kwargs)
        
        if db_field.name == "groups" and request.user.groups.filter(name="Administrador").exists() and not request.user.is_superuser:
             formfield.queryset = Group.objects.exclude(name="Administrador")
             
        return formfield
    
    def has_change_permission(self, request, obj=None):
        if obj == None:
            return True
        else:
            if request.user.is_superuser:
                return True
            else:
                if request.user.id == obj.id:
                    return True
                
                can_change = (obj.is_superuser == False and not obj.groups.filter(name="Administrador").exists())
                return can_change
    
    def get_form(self, request, obj=None, **kwargs):
        
        if obj is not None and request.user.id == obj.id and request.user.groups.filter(name="Administrador").exists() and not request.user.is_superuser:
            kwargs['form'] = CustomUserChangeFormWhenAdminIsEditingItself
        
        form = super(CustomUserAdmin, self).get_form(request, obj, **kwargs)
        #form.user = request.user # allow access of request from form
        return form
        
admin.site.unregister(User)
admin.site.unregister(Group)
admin.site.register(User, CustomUserAdmin)
