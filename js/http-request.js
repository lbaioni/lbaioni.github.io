const _genericHttpRequest = (httpRequest) => {

    // Private methods
    const _stringifyRequestBody = (body) => typeof body === 'object' ? JSON.stringify(body) : body;
    const _getResponseBody = (httpClient) => {
        try { return JSON.parse(httpClient.response); }
        catch (err) { return httpClient.response; }
    };
    const _getResponseHeaders = (httpClient) => {
        const headers = HttpResponseHeaders.build();
        const headersArr = httpClient.getAllResponseHeaders().split('\n');
        headersArr.forEach(header => {
            const keyVal = header.split(':');
            if (keyVal[0] && keyVal[0].trim()) { headers.set(keyVal[0].trim(), keyVal[1].trim()); }
        });
        return headers;
    };

    // START Request Builder
    const _httpClient = new XMLHttpRequest();

    // SET Callbacks
    _httpClient.onreadystatechange = () => {
        if (_httpClient.readyState == 4 && _httpClient.status.toString().startsWith(2) && httpRequest._onSuccess) {
            httpRequest._onSuccess(_getResponseBody(_httpClient), _getResponseHeaders(_httpClient));
        } else if (_httpClient.readyState == 4) {
            // UNAUTHORIZED: Token non piu valido
            if (_httpClient.status === 401) {
                SessionStorageUtil.remove(Constants.sessionStorage.AUTH_TOKEN);
                Router.navigate('../login/login.html');
            }
            if (httpRequest._onError) {
                httpRequest._onError(_getResponseBody(_httpClient), _getResponseHeaders(_httpClient), _httpClient.status);
            }
        }
    }

    // OPEN Request
    _httpClient.open(httpRequest._requestMethod, httpRequest._url, true);

    // SET Headers
    _httpClient.setRequestHeader('Accept', httpRequest._contentType);
    _httpClient.setRequestHeader('Content-Type', httpRequest._contentType);
    httpRequest._headers.forEach(header => { _httpClient.setRequestHeader(header.key, header.value); });

    // SEND Request
    _httpClient.send(httpRequest._body === null ? null : _stringifyRequestBody(httpRequest._body));

};

const _sendMultipleHttpRequest = (multipleHttpRequest) => {
    if (!Arrays.isEmpty(multipleHttpRequest._httpRequests)) {
        _sendSingleHttpRequest(multipleHttpRequest);
    }
};

const _sendSingleHttpRequest = (multipleHttpRequest, index = 0) => {
    const totRequests = multipleHttpRequest._httpRequests.length;
    const httpRequest = multipleHttpRequest._httpRequests[index];
    httpRequest
        .onSuccess((responseBody, responseHeaders) => {
            index++;
            if (index === totRequests) {
                if (multipleHttpRequest._onSuccess) {
                    multipleHttpRequest._onSuccess(responseBody, responseHeaders);
                }
            } else {
                _sendSingleHttpRequest(multipleHttpRequest, index);
            }
        })
        .onError((responseBody, responseHeaders, status) => {
            if (multipleHttpRequest._onError) {
                multipleHttpRequest._onError(responseBody, responseHeaders, status);
            }
        })
        .send();
}

class HttpResponseHeaders {
    constructor() { this._headers = {}; }
    static build = () => new HttpResponseHeaders();
    set = (key, value) => { this._headers[key] = value; return this; };
    get = (key) => this._headers[key];
}

class HttpRequest {
    constructor(requestMethod) {
        this._url = null;
        this._body = null;
        this._headers = [];
        this._onSuccess = null;
        this._onError = null;
        this._requestMethod = requestMethod;
        this._contentType = HttpContentType.JSON;
        this._responseType = HttpResponseType.JSON;
    }
    static post = () => new HttpRequest(HttpRequestMethod.POST);
    static get = () => new HttpRequest(HttpRequestMethod.GET);
    url = (url) => { this._url = url; return this; };
    addHeader = (key, value) => { this._headers.push({ key, value }); return this; };
    addParam = (key, value) => { this._url = this._url + (this._url.includes('?') ? '&' : '?') + key + '=' + value; return this; };
    contentType = (contentType) => { this._contentType = contentType; return this; };
    responseType = (responseType) => { this._responseType = responseType; return this; };
    body = (body) => { this._body = body; return this; };
    onSuccess = (onSuccess) => { this._onSuccess = onSuccess; return this; };
    onError = (onError) => { this._onError = onError; return this; };
    send = () => _genericHttpRequest(this);
}

class MultipleHttpRequest {
    constructor() {
        this._httpRequests = [];
        this._onSuccess = null;
        this._onError = null;
    }
    static build = () => new MultipleHttpRequest();
    addHttpRequest = (httpRequest) => { this._httpRequests.push(httpRequest); return this; };
    onSuccess = (onSuccess) => { this._onSuccess = onSuccess; return this; };
    onError = (onError) => { this._onError = onError; return this; };
    sendAll = () => _sendMultipleHttpRequest(this);
}

class HttpResponseType {
    static JSON = 'application/json';
    static TEXT = 'text/html';
}

class HttpContentType {
    static JSON = 'application/json';
    static TEXT = 'text/html';
}

class HttpRequestMethod {
    static GET = 'GET';
    static POST = 'POST';
}