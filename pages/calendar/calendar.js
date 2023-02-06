let authToken, userId, idCompany, actualYear, timbrature, isMeseConsolidato, commesse = [], giorniSelezionati = [], giorniDaConsuntivare = [], calendarValues = [];

// On DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Versione ' + Constants.APP_VERSION + ' - ' + Constants.APP_DEVELOPER);
    if (checkIfIsSessionValid()) {
        authToken = SessionStorageUtil.get(Constants.sessionStorage.AUTH_TOKEN);
        userId = SessionStorageUtil.get(Constants.sessionStorage.USER_ID);
        idCompany = SessionStorageUtil.get(Constants.sessionStorage.ID_COMPANY);
        actualYear = new Date().getFullYear();

        // Pre-compilo i dati sugli orari
        FormUtil.setFieldValue('morning-start-hh', '09');
        FormUtil.setFieldValue('morning-start-mm', '00');
        FormUtil.setFieldValue('morning-end-hh', '13');
        FormUtil.setFieldValue('morning-end-mm', '00');
        FormUtil.setFieldValue('afternoon-start-hh', '14');
        FormUtil.setFieldValue('afternoon-start-mm', '00');
        FormUtil.setFieldValue('afternoon-end-hh', '18');
        FormUtil.setFieldValue('afternoon-end-mm', '00');

        buildMonths();
    }
});

class Commessa {
    constructor(codiceAttivita, cliente, descrizioneAttivita, dataInizio, dataFine) {
        this.codiceAttivita = codiceAttivita;
        this.cliente = cliente;
        this.descrizioneAttivita = descrizioneAttivita;
        this.dataInizio = dataInizio;
        this.dataFine = dataFine;
    }
    static buildFromResponse = (res) => new Commessa(res.codiceAttivita, res.cliente, res.descrizioneAttivita, res.dal, res.al);
}

const clean = () => onChooseMonth();

const onTimeSelectionModeChecked = (event) => {
    if (event.checked) {
        FormUtil.showElement('start-launch');
        FormUtil.showElement('end-launch');
    } else {
        FormUtil.hideElement('start-launch');
        FormUtil.hideElement('end-launch');
    }
}

const onChooseMonth = () => {
    cleanAfterMonthChange();
    getTimbrature();
    getCommesse();
    setMeseConsolidato();
}

const getSelectedMonthYear = () => actualYear - (getSelectedMonth() === '12' ? 1 : 0);

const getFestivita = () => {
    const findPasquetta = year => {
        let a, b, c, d, e, f, g, h, i, k, l, m, n, p;

        a = year % 19;
        b = Math.floor(year / 100);
        c = year % 100;
        d = Math.floor(b / 4);
        e = b % 4;
        f = Math.floor((b + 8) / 25);
        g = Math.floor((b - f + 1) / 3);
        h = (19 * a + b - d - g + 15) % 30;
        i = Math.floor(c / 4);
        k = c % 4;
        l = (32 + 2 * e + 2 * i - h - k) % 7;
        m = Math.floor((a + 11 * h + 22 * l) / 451);
        n = Math.floor((h + l - 7 * m + 114) / 31);
        p = (h + l - 7 * m + 114) % 31;

        return { month: n, day: p + 2 };
    }

    const pasquetta = findPasquetta(getSelectedMonthYear());
    const festivita = Constants.festivitaByMonth[getSelectedMonth()] || [];
    if (getSelectedMonth() === pasquetta.month.toString()) {
        festivita.push(pasquetta.day);
    }
    return festivita;
};

const getSelectedMonth = () => {
    // Recupero il mese di riferimento dal form
    return FormUtil.getFieldValue('month');
}

const buildMonths = () => {
    const monthCombo = FormUtil.getElement('month');
    const actualMonth = new Date().getMonth();

    // Mese precedente
    let opt = document.createElement('option');
    opt.value = actualMonth === 0 ? 12 : actualMonth;
    opt.innerHTML = Constants.months[opt.value - 1];
    monthCombo.appendChild(opt);

    // Mese attuale
    opt = document.createElement('option');
    opt.value = actualMonth + 1;
    opt.innerHTML = Constants.months[opt.value - 1];
    monthCombo.appendChild(opt);

    // Pre-seleziono il mese attuale
    FormUtil.setFieldValue('month', opt.value);
    onChooseMonth();
}

const cleanAfterMonthChange = () => {
    // Pulisco la descrizione delle ore lavorate sulle cella
    const workingDays = FormUtil.getElementsByClassName('cal-cell-desc');
    for (const wD of workingDays) { wD.innerHTML = ''; }

    // Pulisco la selezione di tutte le celle
    giorniSelezionati = [];
    const selectedDays = FormUtil.getElementsByClassName('selected-day');
    while (selectedDays.length) { selectedDays[0].classList.remove('selected-day'); }
    const updatedDays = FormUtil.getElementsByClassName('cal-cell-desc new');
    while (updatedDays.length) { updatedDays[0].classList.remove('new'); }

    // Ripulisco la lista di giorni da consuntivare
    giorniDaConsuntivare = [];
}

const buildCalendar = () => {
    const festivita = getFestivita();
    const month = getSelectedMonth();
    const getDaysBetweenTwoDates = (dt1, dt2) => Math.ceil((dt2.getTime() - dt1.getTime()) / (1000 * 3600 * 24));
    const getMonthLastDate = (month) => new Date(actualYear, month, 0);
    calendarValues = [];
    const firstDay = new Date(getSelectedMonthYear(), month - 1, 1);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay() + 1);
    const lastDay = getMonthLastDate(month);
    lastDay.setDate(lastDay.getDate() + 7 - lastDay.getDay());
    if (getDaysBetweenTwoDates(firstDay, lastDay) < 41) {
        lastDay.setDate(lastDay.getDate() + 7);
    }

    let currentDate = new Date(Util.clone(firstDay));
    while (currentDate <= lastDay) {
        // Controllo che non sia sabato, domenica o festivo
        const isWorkingDay = (dt) => dt.getDay() != 0 && dt.getDay() != 6 && !festivita.includes(dt.getDate());
        const isEnabled = (dt) => (dt.getMonth() + 1) == month;
        const isOverToday = (dt) => Number(month) === (new Date().getMonth() + 1) && dt.getDate() > new Date().getDate();
        calendarValues.push({
            day: currentDate.getDate(),
            workingDay: isWorkingDay(currentDate),
            disabled: !isEnabled(currentDate),
            overToday: isOverToday(currentDate),
            cellID: null
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Popolo il calendario a FE
    calendarValues.forEach((calendarValue, i) => {
        const cellID = 'cal-cell-' + (i + 1);
        const cell = FormUtil.getElement(cellID);
        calendarValue.cellID = cellID;
        cell.classList.remove('out-day');
        cell.classList.remove('working-day');
        FormUtil.getElement(cellID + '-day').innerHTML = calendarValue.day;
        const totOreLavorate = timbrature[calendarValue.day] ? timbrature[calendarValue.day].total / 60 : 0;
        if (totOreLavorate && !calendarValue.disabled) { FormUtil.getElement(cellID + '-desc').innerHTML = (totOreLavorate + (totOreLavorate === 1 ? ' ORA' : ' ORE')); }
        cell.onclick = () => onClickCell(cellID, calendarValue.day);
        if (calendarValue.disabled) {
            cell.classList.add('out-day');
            cell.onclick = null;
        } else if (!calendarValue.workingDay) {
            cell.classList.add('not-working-day');
        } else {
            cell.classList.add('working-day');
        }
        if (!calendarValue.disabled && calendarValue.overToday) {
            cell.classList.add('over-today');
            cell.onclick = null;
        }
    });

    FormUtil.showElement('calendar-area');
}

const onClickCell = (cellID, day) => {
    const cell = FormUtil.getElement(cellID);
    if (giorniSelezionati.find(d => d === day)) {
        giorniSelezionati = giorniSelezionati.filter(d => d !== day);
        cell.classList.remove('selected-day');
    } else {
        giorniSelezionati.push(day);
        cell.classList.add('selected-day');
    }
};

const onConfermaParziale = () => {
    const buildDate = (month, day, hours, minutes) => new Date(getSelectedMonthYear(), month - 1, day, hours, minutes);
    const timesDiffBetweenDates = (dt1, dt2) => ((dt2.getTime() - dt1.getTime()) / 1000) / (60 * 60);

    // Recupero i valori dal form
    const isConsuntivazioneMultipla = FormUtil.getElement('time-selection-mode-cb').checked;
    const selectedMonth = FormUtil.getFieldValue('month');
    const selectedCommission = FormUtil.getFieldValue('commission');
    const morningStartHH = FormUtil.getFieldValue('morning-start-hh');
    const morningStartMM = FormUtil.getFieldValue('morning-start-mm');
    const morningEndHH = FormUtil.getFieldValue('morning-end-hh');
    const morningEndMM = FormUtil.getFieldValue('morning-end-mm');
    const afternoonStartHH = FormUtil.getFieldValue('afternoon-start-hh');
    const afternoonStartMM = FormUtil.getFieldValue('afternoon-start-mm');
    const afternoonEndHH = FormUtil.getFieldValue('afternoon-end-hh');
    const afternoonEndMM = FormUtil.getFieldValue('afternoon-end-mm');

    if (!selectedMonth || selectedCommission === 'NO-VALUE') {
        ToastService.showErrorMessage('Devi selezionare una commessa su cui applicare il timbro');
        return;
    }

    if (isMeseConsolidato) {
        ToastService.showErrorMessage('Non puoi applicare nuovi timbri su di un mese consolidato');
        return;
    }

    // TODO: Implementare controllo che la commessa sia attiva per tutto il periodo selezionato

    const totOreLavorate = timesDiffBetweenDates(buildDate(1, 1, morningStartHH, morningStartMM), buildDate(1, 1, morningEndHH, morningEndMM))
        + (isConsuntivazioneMultipla ? timesDiffBetweenDates(buildDate(1, 1, afternoonStartHH, afternoonStartMM), buildDate(1, 1, afternoonEndHH, afternoonEndMM)) : 0);

    // Aggiungo tanti record
    giorniSelezionati.forEach(day => {
        // Timbro mattinata
        giorniDaConsuntivare.push({
            startDate: buildDate(selectedMonth, day, morningStartHH, morningStartMM),
            endDate: buildDate(selectedMonth, day, morningEndHH, morningEndMM),
            commission: selectedCommission
        });

        // Timbro pomeriggio (solo nel caso di consuntivazione multipla attiva)
        if (isConsuntivazioneMultipla) {
            giorniDaConsuntivare.push({
                startDate: buildDate(selectedMonth, day, afternoonStartHH, afternoonStartMM),
                endDate: buildDate(selectedMonth, day, afternoonEndHH, afternoonEndMM),
                commission: selectedCommission
            });
        }

        // Ri-popolo la descrizione delle ore lavorate sulla cella
        const cellID = calendarValues.find(e => !e.disabled && e.day === day)?.cellID;
        FormUtil.getElement(cellID).classList.remove('selected-day');
        const totOreLavorateBefore = timbrature[day] ? timbrature[day].total / 60 : 0;
        FormUtil.getElement(cellID + '-desc').innerHTML = ((totOreLavorateBefore + totOreLavorate) + (totOreLavorate === 1 ? ' ORA' : ' ORE'));
        FormUtil.getElement(cellID + '-desc').classList.add('new');
    });
    giorniSelezionati = [];
};

const getCommesse = () => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(getSelectedMonth());

    // Effettuo la richiesta sull'API di CyberGuide
    API.getCommesse(authToken, userId, idCompany, DateUtil.formatDate(date))
        .onSuccess((response) => {
            if (response) {
                if (!Arrays.isEmpty(response)) {
                    commesse = response.map(c => Commessa.buildFromResponse(c));

                    const commissionCombo = FormUtil.getElement('commission');

                    // Abilito la combo
                    commissionCombo.removeAttribute('disabled');

                    // Pulisco le options e ri-creo l'option placeholder
                    commissionCombo.innerHTML = '';

                    const optPlaceholder = document.createElement('option');
                    optPlaceholder.value = 'NO-VALUE';
                    optPlaceholder.innerHTML = 'Seleziona una commessa';
                    optPlaceholder.disabled = true;
                    optPlaceholder.selected = true;
                    optPlaceholder.hidden = true;
                    commissionCombo.appendChild(optPlaceholder);

                    commesse.forEach(commessa => {
                        const opt = document.createElement('option');
                        opt.value = commessa.codiceAttivita;
                        opt.innerHTML = commessa.cliente || commessa.descrizioneAttivita;
                        commissionCombo.appendChild(opt);
                    });
                } else {
                    ToastService.showErrorMessage('Nessuna commessa attiva per il periodo selezionato');
                }
            } else {
                ToastService.showErrorMessage('Errore durante il recupero delle commesse attive. Contattare l\'amministratore');
            }
        })
        .onError((response) => {
            ToastService.showErrorMessage('Errore durante il recupero delle commesse attive. Contattare l\'amministratore');
        })
        .send();
}

const getTimbrature = () => {
    // Effettuo la richiesta sull'API di CyberGuide
    API.getTimbrature(authToken, getSelectedMonth() - 1, userId, idCompany, false)
        .onSuccess((response) => {
            if (response) {
                timbrature = getTimbratureElaborate(response.timbrature);
                buildCalendar();
            } else {
                ToastService.showErrorMessage('Errore durante il recupero delle timbrature presenti. Contattare l\'amministratore');
            }
        })
        .onError((response) => {
            ToastService.showErrorMessage('Errore durante il recupero delle timbrature presenti. Contattare l\'amministratore');
        })
        .send();
}

const onSalva = () => {
    if (isMeseConsolidato) {
        ToastService.showErrorMessage('Non puoi applicare nuovi timbri su di un mese consolidato');
        return;
    }

    ToastService.showInfoMessage('Timbratura in corso...');

    const httpRequests = MultipleHttpRequest.build();

    giorniDaConsuntivare.forEach(g => {
        // Costruisco la richiesta e la aggiungo alla lista di richieste da effettuare a CyberGuide
        const httpRequest = API.timbroAnomalo(authToken, userId, idCompany, g.commission, DateUtil.formatDateTime(g.startDate), DateUtil.formatDateTime(g.endDate));
        httpRequests.addHttpRequest(httpRequest);
    });

    // Effettuo la richiesta sull'API di CyberGuide
    httpRequests
        .onSuccess((response) => {
            ToastService.showSuccessMessage('Timbro applicato correttamente');
            onChooseMonth();
        })
        .onError((response) => {
            ToastService.showErrorMessage('Errore durante l\'applicazione del timbro');
        })
        .sendAll();
}

class TimbraturaSemielaborata {
    constructor(day, time, tipo) {
        this.day = day;
        this.time = time;
        this.tipo = tipo;
    }
    static buildFromTimbrature = (t) => new TimbraturaSemielaborata(new Date(t.data).getDate(), DateUtil.formatTime(new Date(t.data)), t.tipoTimbratura);
}

class TimbraturaElaborata {
    constructor(entrata, uscita) {
        this.entrata = entrata;
        this.uscita = uscita;
    }
    isFullFilled = () => this.entrata && this.uscita;
}

const getTimbratureElaborate = (timbrature) => {
    const timbratureSemielaborate = timbrature
        .map(t => (TimbraturaSemielaborata.buildFromTimbrature(t)))
        .sort((a, b) => a.day - b.day)
        .reduce((acc, t) => {
            const _fillEntrataOrUscita = (el, t) => el[t.tipo] = t.time;
            if (!acc[t.day]) { acc[t.day] = [] };
            let el = acc[t.day].length === 0 ? new TimbraturaElaborata() : acc[t.day].splice(-1)[0];
            if (el.isFullFilled()) { acc[t.day].push(el); el = new TimbraturaElaborata(); }
            _fillEntrataOrUscita(el, t);
            acc[t.day].push(el);
            return acc;
        }, {});

    const getTimeTotal = timbratura => {
        const entrata = timbratura.entrata.split(':');
        const uscita = timbratura.uscita.split(':');
        const oreTotali = Number(uscita[0]) - Number(entrata[0]);
        const minutiTotali = Number(uscita[1]) - Number(entrata[1]);
        if (minutiTotali < 0) { minutiTotali += 60; oreTotali -= 1; }
        return (oreTotali * 60) + minutiTotali;
    }

    const obj = {};

    Object.keys(timbratureSemielaborate).forEach(key => {
        obj[key] = {
            times: timbratureSemielaborate[key],
            total: timbratureSemielaborate[key].reduce((acc, e) => acc + getTimeTotal(e), 0)
        };
    });

    return obj;
}

const setMeseConsolidato = () => {
    // Effettuo la richiesta sull'API di CyberGuide
    API.isMeseConsolidato(authToken, userId, idCompany, getSelectedMonthYear(), Number(getSelectedMonth()))
        .onSuccess((response) => {
            isMeseConsolidato = response;
            FormUtil.getElement('month-status').innerHTML = response ? 'Consolidato' : 'Non Consolidato';
        })
        .onError((response) => {
            ToastService.showErrorMessage('Errore durante il recupero dello stato del mese. Contattare l\'amministratore');
        })
        .send();
}