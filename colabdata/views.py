from django.shortcuts import redirect
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def get_index(request):
    return redirect('static/index.html')