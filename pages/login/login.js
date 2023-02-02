// On DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Versione ' + Constants.APP_VERSION + ' - ' + Constants.APP_DEVELOPER);
});

const login = () => {
    // Recupero username e password dal form
    const username = FormUtil.getFieldValue('username') + Constants.EMAIL_DOMAIN;
    const password = FormUtil.getFieldValue('password');

    ToastService.showInfoMessage('Login in corso...');

    // Effettuo la richiesta sull'API di CyberGuide
    API.login(username, password)
        .onSuccess((response, headers) => {
            if (response && !Arrays.isEmpty(response.users)) {
                // SET AUTH_TOKEN
                const authToken = headers.get('authorization');
                SessionStorageUtil.set(Constants.sessionStorage.AUTH_TOKEN, authToken);
                // SET ID_COMPANY
                const idCompany = response.users[0].idCompany;
                SessionStorageUtil.set(Constants.sessionStorage.ID_COMPANY, idCompany);
                // SET USER_ID
                const userId = response.users[0].userId;
                SessionStorageUtil.set(Constants.sessionStorage.USER_ID, userId);

                Router.navigate('../calendar/calendar.html');
            } else {
                ToastService.showErrorMessage('Errore durante la login. Contattare l\'amministratore');
            }
        })
        .onError((response) => {
            ToastService.showErrorMessage('Credenziali errate');
        })
        .send();

    return false;
};