const checkIfIsSessionValid = () => {
    if (!SessionStorageUtil.get(Constants.sessionStorage.AUTH_TOKEN)) {
        Router.navigate('../login/login.html');
        return false;
    }
    return true;
};