class Util {
    static isNotNull = (obj) => obj !== null && typeof obj !== 'undefined';
    static clone = (obj) => JSON.parse(JSON.stringify(obj));
    static isProdMode = () => !window.location.href.startsWith('file://');
    static getLocalBasePath = () => window.location.href.split('/').slice(0, -1).join('/');
    static padZero = (n) => (n < 10 ? ('0' + n) : n);
}

class SessionStorageUtil {
    static set = (key, value) => sessionStorage.setItem(key, JSON.stringify(value));
    static get = (key) => {
        try { return JSON.parse(sessionStorage.getItem(key)); }
        catch (error) { return null; }
    };
    static remove = (key) => sessionStorage.removeItem(key);
}

class Arrays {
    static isArray = (arr) => arr && Array.isArray(arr);
    static isEmpty = (arr) => !Arrays.isArray(arr) || !arr.length > 0;
}

class DateUtil {
    static formatDate = (date) => (date instanceof Date) ? date.toISOString().split('T')[0] : 'Invalid Date';
    static formatDateTime = (date) => (date instanceof Date) ? (date.toISOString().split('T')[0] + ' ' + DateUtil.formatTime(date) + ':00') : 'Invalid Date';
    static formatTime = (date) => Util.padZero(date.getHours()) + ':' + Util.padZero(date.getMinutes());
}

class FormUtil {
    static getElement = (id) => document.getElementById(id);
    static getElementsByClassName = (className) => document.getElementsByClassName(className);
    static getFieldValue = (id) => document.getElementById(id)?.value;
    static setFieldValue = (id, value) => document.getElementById(id).value = value;
    static setFormAction = (formId, fn) => document.getElementById(formId).onsubmit = (event) => { event.preventDefault(); console.log(fn); fn.call(); };
    static hideElement = (id) => document.getElementById(id).classList.add('hidden');
    static showElement = (id) => document.getElementById(id).classList.remove('hidden');
    static hideElementByOpacity = (id) => document.getElementById(id).classList.add('not-visible');
    static showElementByOpacity = (id) => document.getElementById(id).classList.remove('not-visible');
    static preventReloading = () => false;
}

class Router {
    static navigate = (path) => window.location.href = path;
}

class ToastService {
    static #id = 'toast-element';
    static timeout = 5000;
    static activeToasts = 0;
    static #init = (msg, type) => {
        ToastService.#destroy();
        const toast = document.createElement('div');
        toast.id = ToastService.#id;
        toast.classList.add('toast');
        toast.classList.add(type);
        toast.appendChild(document.createTextNode(msg));
        const firstEl = document.getElementsByTagName('div')[0];
        document.body.insertBefore(toast, firstEl);
        ToastService.activeToasts += 1;
        setTimeout(() => ToastService.#show(), 10);
    };
    static #end = () => {
        ToastService.activeToasts -= 1;
        if (ToastService.activeToasts === 0) {
            ToastService.#hide();
            setTimeout(() => ToastService.#destroy(), 400);
        }
    };
    static #show = () => {
        FormUtil.getElement(ToastService.#id).classList.add('visible');
    };
    static #hide = () => {
        FormUtil.getElement(ToastService.#id).classList.remove('visible');
    };
    static #destroy = () => {
        const toast = FormUtil.getElement(ToastService.#id);
        if (toast) { toast.remove(); }
    };
    static showSuccessMessage = (msg) => { ToastService.#init(msg, 'success'); setTimeout(() => ToastService.#end(), ToastService.timeout); }
    static showErrorMessage = (msg) => { ToastService.#init(msg, 'error'); setTimeout(() => ToastService.#end(), ToastService.timeout); }
    static showInfoMessage = (msg) => { ToastService.#init(msg, 'info'); setTimeout(() => ToastService.#end(), ToastService.timeout); }
}