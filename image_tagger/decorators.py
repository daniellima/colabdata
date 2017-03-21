from django.http import HttpResponse

def ajax_aware_login_required(f):
    
    def decoration(request, *args, **kwargs):
        if request.user.is_authenticated:
            return f(request, *args, **kwargs)
        else:
            return HttpResponse(status=401)
            
    return decoration