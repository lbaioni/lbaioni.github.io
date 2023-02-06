class Constants {
    static ENDPOINT_LOGIN = 'https://intranet.majorbit.com/ms/auth/utenti/accesso';
    static ENDPOINT_GET_COMMESSE = 'https://intranet.majorbit.com/ms/timesheet/timesheet/getCommesse';
    static ENDPOINT_TIMBRO_ANOMALO = 'https://intranet.majorbit.com/ms/timesheet/timesheet/timbro_anomalo';
    static ENDPOINT_TIMBRATURE = 'https://intranet.majorbit.com/ms/timesheet/timesheet/timbrature';
    static ENDPOINT_IS_MESE_CONSOLIDATO = 'https://intranet.majorbit.com/ms/timesheet/timesheet/is_mese_consolidato';
    static EMAIL_DOMAIN = '@majorbit.com';
    static APP_DEVELOPER = 'Leonardo Baioni';
    static APP_VERSION = '0.0.2';
    static sessionStorage = {
        AUTH_TOKEN: 'AUTH_TOKEN',
        ID_COMPANY: 'ID_COMPANY',
        USER_ID: 'USER_ID'
    };
    static festivitaByMonth = {
        1: [1, 6],
        4: [25],
        5: [1],
        6: [2, 29],
        8: [15],
        11: [1],
        12: [8, 25, 26]
    };
    static months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
};