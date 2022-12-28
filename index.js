async function autocomplete(inp) {
    var localStorage = {};
    var historyListElement = document.getElementById('historyList');
    var countryInfoElement = document.getElementById('countryInfo');
    let baseUrl = 'https://restcountries.com/v3.1/name/';
    let isStorageAvailable = storageAvailable('localStorage');

    if (isStorageAvailable) {
        localStorage = window.localStorage;
        updateHistory(historyListElement);
        window.addEventListener('storage', () => updateHistory(historyListElement));
    }

    inp.addEventListener('input', async function (e) {
        let suggestConteiner;
        let val = this.value;
        if (!val) { return false; }

        closeAllLists();
        suggestConteiner = document.createElement('div');
        suggestConteiner.setAttribute('id', this.id + 'autocomplete-list');
        suggestConteiner.setAttribute('class', 'autocomplete-items');
        this.parentNode.appendChild(suggestConteiner);
        let counter = 0;

        let suggestions = getSuggestFromLocalStorage(val);
        for (let i = 0; i < suggestions.length; i++) {
            appendSuggest(suggestConteiner, true, suggestions[i]);
            counter++;
        }

        let countries = await fetchCountriesNames(val);
        if (countries == null) return;
        for (let i = 0; i < countries.length; i++) {
            if (countries[i].toUpperCase().includes(val.toUpperCase())
                && !suggestions.includes(countries[i])
                && counter < 10) {
                appendSuggest(suggestConteiner, false, countries[i]);
                counter++;
            }
        }
    });

    async function fetchCountries(query) {
        const response = await fetch(baseUrl + query, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow',
        })
            .then((response) => {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response;
            })
            .catch((error) => { console.log(error); return null; });

        if (response == null)
            return null;

        let jsonResponse = await response.json();
        return jsonResponse;
    }

    async function fetchCountriesNames(query) {
        let jsonResponse = await fetchCountries(query);
        if (jsonResponse !== null)
            jsonResponse = jsonResponse.map(item => item.name.common);
        return jsonResponse;
    }

    async function fetchCountryInfo(country) {
        let jsonResponse = await fetchCountries(country);
        if (jsonResponse === null)
            return jsonResponse;
        return jsonResponse[0];
    }

    function updateLocalStorage(country) {
        if (!isStorageAvailable) return;
        let countryKey = findCountryKeyInStorage(country);
        if (countryKey) localStorage.removeItem(countryKey);
        try {
            localStorage.setItem(Date.now(), country);
        }
        catch (e) {
            console.error('An error occurred while setting new item in localStorage.');
        }
    }

    function storageAvailable(type) {
        try {
            var storage = window[type],
                x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        }
        catch (e) {
            return false;
        }
    }

    function findCountryKeyInStorage(country) {
        let index = 0;
        while (index < localStorage.length) {
            let key = localStorage.key(index);
            if (localStorage.getItem(key) == country)
                return localStorage.key(index);
            index++;
        }
        return null;
    }

    function getSuggestFromLocalStorage(content) {
        // Вводим массив ключей,для того чтобы подсказывать начиная с самых недавних.
        // Сортировка по индексу хранилища не подходит, так как реализация не стандартизована.
        // https://developer.mozilla.org/ru/docs/Web/API/Storage/key
        let result = [];
        let keys = [];
        if (!isStorageAvailable) return result;
        for (let index = 0; index < localStorage.length; index++)
            keys.push(localStorage.key(index));

        keys.sort();
        let uContent = content.toUpperCase();
        for (let index = keys.length - 1; index >= 0; index--) {
            let currentKey = localStorage.getItem(keys[index]).toUpperCase();
            if (currentKey.includes(uContent))
                result.push(localStorage.getItem(keys[index]));
            if (result.length == 5)
                break;
        }
        return result;
    }

    function updateHistory(container) {
        if (!isStorageAvailable) return;
        if (localStorage.length == 0) return;
        let keys = [];
        for (let keyIndex = 0; keyIndex < localStorage.length; keyIndex++)
            keys.push(localStorage.key(keyIndex));

        keys.sort();
        keyIndex = 0;
        container.innerHTML = '';

        while (keyIndex <= keys.length - 1 && keyIndex < 3) {
            let country = localStorage.getItem(keys[keys.length - keyIndex - 1]);
            let countryElement = document.createElement('div');
            countryElement.setAttribute('class', 'history__item');
            countryElement.innerText = country;
            countryElement.addEventListener('click', function (e) {
                showCountryInfo(country);
                closeAllLists();
                inp.value = country;
            });
            container.appendChild(countryElement);
            keyIndex++;
        }
    }

    function appendSuggest(container, isFromStorage, content) {
        let host = document.createElement('div');
        host.classList.add('search__suggest-item');
        if (isFromStorage) host.innerHTML += `<strong>${content}</strong>`;
        else host.innerHTML += content;

        host.addEventListener('click', function (e) {
            inp.value = content;
            updateLocalStorage(content);
            updateHistory(historyListElement);
            showCountryInfo(content);
            closeAllLists();
        });
        container.appendChild(host);
    }

    async function showCountryInfo(country) {
        let info = await fetchCountryInfo(country);
        if (info == null) return;
        countryInfoElement.innerHTML = '';
        countryInfoElement.innerHTML += `<div>Название: ${info.name.common}<\div>`;
        countryInfoElement.innerHTML += `<div>Столица: ${info.capital[0]}<\div>`;
        countryInfoElement.innerHTML += `<div>Регион: ${info.region}<\div>`;
        countryInfoElement.innerHTML += `<div>Площадь: ${info.area} кв. км.<\div>`;
        countryInfoElement.innerHTML += `<div>Флаг: ${info.flag}<\div>`;
        countryInfoElement.innerHTML += `<div>Численность: ${info.population}<\div>`;
        countryInfoElement.innerHTML += `<div>Герб:<\div>`;
        countryInfoElement.innerHTML += `<img src='${info.coatOfArms.svg}' alt='Герб'></img>`;
    }

    function closeAllLists(element) {
        var x = document.getElementsByClassName('autocomplete-items');
        for (var i = 0; i < x.length; i++)
            if (element != x[i] && element != inp)
                x[i].parentNode.removeChild(x[i]);
    }

    document.addEventListener('click', function (e) {
        closeAllLists(e.target);
    });
}

autocomplete(document.getElementById('countryInput'));
