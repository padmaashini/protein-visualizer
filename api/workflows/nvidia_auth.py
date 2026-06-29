from requests.auth import AuthBase


class NvidiaAuth(AuthBase):
    """Attach a NVIDIA Bearer token to outgoing requests."""

    def __init__(self, token: str):
        self._token = token

    def __call__(self, request):
        request.headers["Authorization"] = f"Bearer {self._token}"
        return request
