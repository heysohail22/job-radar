"""Stateless Supabase Data API/Auth access; secrets never leave the server."""
import httpx
from .config import Settings


class ApiError(Exception):
    def __init__(self, message, status=500, code=''):
        self.message, self.status, self.code = message, status, code
        super().__init__(message)


class Database:
    def __init__(self, settings: Settings, transport=None):
        self.settings = settings
        self.client = httpx.Client(timeout=20, transport=transport, follow_redirects=False)

    def request(self, method, path, *, params=None, body=None, token=None, prefer=None):
        s = self.settings
        if not s.supabase_url or not s.supabase_secret_key.get_secret_value():
            raise ApiError('Backend database configuration is missing.', 503)
        key = s.supabase_secret_key.get_secret_value()
        headers = {'apikey': key, 'Authorization': 'Bearer ' + (token or key)}
        if prefer:
            headers['Prefer'] = prefer
        try:
            response = self.client.request(method, s.supabase_url.rstrip('/') + path,
                                           params=params, json=body, headers=headers)
            data = response.json() if response.content else None
        except (httpx.HTTPError, ValueError):
            raise ApiError('Database request unavailable.', 502) from None
        if not response.is_success:
            code = str(data.get('code', '')) if isinstance(data, dict) else ''
            if code in ('40001', 'PT409'):
                raise ApiError('This job changed. Refresh and try again.', 409, code)
            if code == 'P0002':
                raise ApiError('Match not found.', 404, code)
            raise ApiError('Database request could not be completed.', 502, code)
        return data

    def rpc(self, name, args):
        return self.request('POST', '/rest/v1/rpc/' + name, body=args)

    def rows(self, table, **params):
        return self.request('GET', '/rest/v1/' + table, params=params)

    def insert(self, table, body, *, conflict=None, ignore=False):
        prefer = 'return=representation'
        if conflict:
            prefer += ',resolution=' + ('ignore-duplicates' if ignore else 'merge-duplicates')
        return self.request('POST', '/rest/v1/' + table, body=body,
                            params={'on_conflict': conflict} if conflict else None, prefer=prefer)

    def patch(self, table, body, **params):
        return self.request('PATCH', '/rest/v1/' + table, body=body, params=params,
                            prefer='return=representation')

    def delete(self, table, **params):
        return self.request('DELETE', '/rest/v1/' + table, params=params)

    def close(self):
        self.client.close()
