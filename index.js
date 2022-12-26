async function autocomplete(inp) {
    var localStorage = window.localStorage;
    var historyListElement = document.getElementById('historyList');
    var countryInfoElement = document.getElementById('countryInfo');
    let baseUrl = 'https://restcountries.com/v3.1/name/';

    updateHistory(historyListElement);
    window.addEventListener('storage', () => updateHistory(historyListElement));

    inp.addEventListener('input', async function (e) {
        let suggestConteiner;
        let suggestItem;
        let val = this.value;
        if (!val) { return false; }

        closeAllLists();
        suggestConteiner = document.createElement('div');
        suggestConteiner.setAttribute('id', this.id + 'autocomplete-list');
        suggestConteiner.setAttribute('class', 'autocomplete-items');
        this.parentNode.appendChild(suggestConteiner);
        let counter = 0;

        let countries = await getCountriesNames(val);
        let suggestions = getSuggestFromLocalStorage(val);

        for (let i = 0; i < suggestions.length; i++) {
            appendSuggest(suggestConteiner, true, suggestions[i]);
            counter++;
        }

        for (let i = 0; i < countries.length; i++) {
            if (countries[i].toUpperCase().includes(val.toUpperCase())
                && !suggestions.includes(countries[i])
                && counter < 10) {
                appendSuggest(suggestConteiner, false, countries[i]);
                counter++;
            }
        }
    });

    async function getCountriesNames(searchInput) {
        const response = await fetch(baseUrl + searchInput, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow',
        });
        let jsonResponse = await response.json();
        jsonResponse = jsonResponse.map(item => item.name.common);
        return jsonResponse;
    }

    async function fetchCountryInfo(country) {
        const response = await fetch(baseUrl + country, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow',
        });
        let jsonResponse = await response.json();
        return jsonResponse;
    }

    function updateLocalStorage(country) {
        let countryKey = findCountryKey(country);
        if (countryKey) localStorage.removeItem(countryKey);
        localStorage.setItem(Date.now(), country);
    }

    function findCountryKey(country) {
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
        let inserter = document.createElement('div');
        inserter.classList.add('search__suggest-item');
        if (isFromStorage) inserter.innerHTML += `<strong>${content}</strong>`;
        else inserter.innerHTML += content;

        inserter.addEventListener('click', function (e) {
            inp.value = content;
            updateLocalStorage(content);
            updateHistory(historyListElement);
            showCountryInfo(content);
            closeAllLists();
        });
        container.appendChild(inserter);
    }

    async function showCountryInfo(country) {
        let info = await fetchCountryInfo(country);
        countryInfoElement.innerHTML = '';
        countryInfoElement.innerHTML += `<div>Название: ${info[0].name.common}<\div>`;
        countryInfoElement.innerHTML += `<div>Столица: ${info[0].capital[0]}<\div>`;
        countryInfoElement.innerHTML += `<div>Регион: ${info[0].region}<\div>`;
        countryInfoElement.innerHTML += `<div>Площадь: ${info[0].area} кв. км.<\div>`;
        countryInfoElement.innerHTML += `<div>Флаг: ${info[0].flag}<\div>`;
        countryInfoElement.innerHTML += `<div>Численность: ${info[0].population}<\div>`;
        countryInfoElement.innerHTML += `<div>Герб:<\div>`;
        countryInfoElement.innerHTML += `<img src='${info[0].coatOfArms.svg}' alt='Герб'></img>`;
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
