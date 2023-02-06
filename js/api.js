class API {
    static login = (username, password) => {
        return HttpRequest
            .post()
            .url(Constants.ENDPOINT_LOGIN)
            .body({ username, password });
    }

    static getCommesse = (authToken, userId, idCompany, date) => {
        return HttpRequest
            .get()
            .url(Constants.ENDPOINT_GET_COMMESSE)
            .addHeader('Authorization', authToken)
            .addParam('username', userId)
            .addParam('idCompany', idCompany)
            .addParam('date', date);
    }

    static getTimbrature = (authToken, month, userId, idCompany, isPrevious = null) => {
        const httpReq = HttpRequest
            .get()
            .url(Constants.ENDPOINT_TIMBRATURE)
            .addHeader('Authorization', authToken)
            .addHeader('tkn', null)
            .addParam('mese', month)
            .addParam('username', userId)
            .addParam('idCompany', idCompany);
        return isPrevious ? httpReq.addParam('previous', isPrevious) : httpReq;
    }

    static timbroAnomalo = (authToken, userId, idCompany, codiceAttivita, ingresso, uscita) => {
        return HttpRequest
            .post()
            .url(Constants.ENDPOINT_TIMBRO_ANOMALO)
            .addHeader('Authorization', authToken)
            .body({
                cliente: null,
                codiceAttivita,
                idCompany,
                ingresso,
                sede: null,
                smartWorking: true,
                uscita,
                username: userId
            });
    }

    static isMeseConsolidato = (authToken, userId, idCompany, anno, mese) => {
        return HttpRequest
            .post()
            .url(Constants.ENDPOINT_IS_MESE_CONSOLIDATO)
            .addHeader('Authorization', authToken)
            .body({
                username: userId,
                idCompany,
                anno,
                mese
            });
    }
}