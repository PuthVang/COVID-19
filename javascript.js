var proxy = 'https://cors-anywhere.herokuapp.com/';

var cooldown;

var globalStats;
var allCountryStats;
var availableCountryCodeList = [];
var availableCountryList = [];
var arrayAvailableCountryList = [];

var countriesData = [];
var countriesCases = [];
var countriesDeaths = [];
var countriesRecovered = [];
var countriesGraph;
var countriesLogGraph;

var selectedCountry = "Afghanistan";
var sortedList = [];

function startUp(refresh){
  if (!(refresh)){
    loadGlobalStats();
    loadAllStats();
    setupCooldown();
  }else if (refresh){
    if ((document.getElementById("refresh").innerText == "") || parseFloat(document.getElementById("refresh").innerText) == 0.0){

      cooldown.start(15);
    }
  }
}

function setupCooldown(){
  cooldown = $("#refresh").cooldown({
    tickFrequency:      50,        // Frequency of ticks (milliseconds), not recommended <50, affects
    // countdown (and arc in non-Chrome browsers)
    arcWidth:           10,        // Arc stroke width
    arcColor:           "#27ae60", // Arc stroke color
    arcBackgroundColor: "#d7d8d9", // Arc stroke unfinished color
    toFixed:            1,         // Number of decimal places to show in countdown
    introDuration:      500,       // Duration of spinning intro (milliseconds), set to 0 to disable
    countdownCss:       
    {          // Object of CSS attributes (passed to jQuery's css() function)
      width: "0%",
      height: "0%",
      margin: 0,
      padding: 0,
      textAlign: "center",
      fontSize: "0px"
    },
    completeFn: null,
    countdownFn: null
  })
}

function getCountryNameFromISO2(countryName){
  return availableCountryList[countryName]
}

function getCountryISO2FromName(countryISO2){
  return availableCountryCodeList[countryISO2]
}

function loadGlobalStats(){
  var myUrl = 'https://thevirustracker.com/free-api?global=stats';
  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", function () {
      globalStats = JSON.parse(this.responseText);
      getConfirmedCases();
      getConfirmedDead();
      getConfirmedRecovered();
  });
  oReq.open("GET", proxy + myUrl);
  oReq.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  oReq.send();
}

function getConfirmedCases(){
  if ((globalStats != null) || (globalStats != undefined)){
    document.getElementById("casesConfirmed").innerHTML = "";
    caseCount = globalStats.results[0].total_cases;
    document.getElementById("casesConfirmed").innerHTML = caseCount + "<br>";
    return caseCount;
  }
}

function getConfirmedDead(){
  if ((globalStats != null) || (globalStats != undefined)){
    document.getElementById("deathsConfirmed").innerHTML = "";
    deathsCount = globalStats.results[0].total_deaths;
    document.getElementById("deathsConfirmed").innerHTML = deathsCount + "<br>";
    return deathsCount;
  }
}

function getConfirmedRecovered(){
  if ((globalStats != null) || (globalStats != undefined)){
    document.getElementById("recoveredConfirmed").innerHTML = "";
    recoveryCount = globalStats.results[0].total_recovered;
    document.getElementById("recoveredConfirmed").innerHTML = recoveryCount;
    return recoveryCount;
  }
}

function loadAllStats(){
  var myUrl = 'https://api.thevirustracker.com/free-api?countryTotals=ALL';
  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", function () {
    allCountryStats = JSON.parse(this.responseText);
    for (var i = 1; i < Object.keys(allCountryStats.countryitems[0]).length; i++){
      var countryCode = allCountryStats.countryitems[0][i].code;
      var country = allCountryStats.countryitems[0][i].title;
      countriesCases[countryCode] = allCountryStats.countryitems[0][i].total_cases - allCountryStats.countryitems[0][i].total_new_cases_today;
      countriesRecovered[countryCode] = allCountryStats.countryitems[0][i].total_recovered;
      countriesDeaths[countryCode] = allCountryStats.countryitems[0][i].total_deaths;
      var json = '{"country":"' + country + '", "confirmed":' + countriesCases[countryCode] + ', "deaths":' + countriesDeaths[countryCode] +', "recovered":' + countriesRecovered[countryCode] + '}';
      var obj = JSON.parse(json);        
      countriesData.push(obj);
    }
    loadCountryNames();
    sortCountries("default");
  });
  oReq.open("GET", proxy + myUrl);
  oReq.send();
}

function loadCountryNames(){
  for (i = 1; i < Object.keys(allCountryStats.countryitems[0]).length; i++){
    availableCountryList[allCountryStats.countryitems[0][i].code] = (allCountryStats.countryitems[0][i].title);
    availableCountryCodeList[allCountryStats.countryitems[0][i].title] = (allCountryStats.countryitems[0][i].code);
    arrayAvailableCountryList[i - 1] = getCountryNameFromISO2(allCountryStats.countryitems[0][i].code);
  }
  addToButtonDropdowns();
}

function addToButtonDropdowns(){
  var sorted = arrayAvailableCountryList.slice().sort((a, b) => b < a);
  for (var i = 0; i < sorted.length; i++){
    addButtonToDropdown(sorted[i], false);
  }
  loadCountriesTimeline(selectedCountry);
}

function addButtonToDropdown(name, reset){
  var element = document.getElementById("dropdownCountriesButton");
  var button = document.createElement("option");
  button.innerHTML = name;
  button.setAttribute("onclick", 'loadCountriesTimeline("' + name + '", true)');
  element.appendChild(button);
  if (reset){
    element.innerHTML = "";
  }
}

function loadCountriesTimeline(countryCode){
  if (countryCode.length > 2){
    countryCode = getCountryISO2FromName(countryCode);
  }
  var myUrl = 'https://thevirustracker.com/free-api?countryTimeline=' + countryCode;
  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", function () {
    var response = JSON.parse(this.responseText);
    var cases = [];
    var recovered = [];
    var deaths = [];
    if (response.timelineitems != undefined){
      for (var i in response.timelineitems[0]){
        if (i != "stat"){
          cases[i] = (response.timelineitems[0][i].total_cases);
          recovered[i] = (response.timelineitems[0][i].total_recoveries);
          deaths[i] = (response.timelineitems[0][i].total_deaths);
        }
      }
    }
    loadGraph(countryCode, cases, recovered, deaths);
  });
  oReq.open("GET", proxy + myUrl);
  oReq.send();
}

function addData(chart, label, data) {
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset) => {
      dataset.data.push(data);
  });
  chart.update();
}

function removeData(chart) {
  chart.data.labels.pop();
  chart.data.datasets.forEach((dataset) => {
      dataset.data.pop();
  });
  chart.update();
}

function loadGraph(country, casesData, recoveredData, deathsData){
  const LINE_CHART = document.getElementById('lineChart').getContext('2d');
  const LOG_CHART = document.getElementById('logChart').getContext('2d');
  if (((countriesGraph != null) && (countriesGraph != undefined)) && ((countriesLogGraph != null) && (countriesLogGraph != undefined))){
    countriesGraph.destroy();
    countriesLogGraph.destroy();
  }
  var countrySelected = document.getElementById("selectedCountry")
  countrySelected.innerHTML = "Graph(s) for %selectedCountry%";
  selectedCountry = getCountryNameFromISO2(country);
  countrySelected.innerHTML = countrySelected.innerHTML.replace(/%selectedCountry%/, selectedCountry);
  countriesLogGraph = new Chart(LOG_CHART, {
     type: 'line',
     data: {
        labels: Object.keys(casesData),
         datasets: [{
            label: "Cases",
            data: Object.values(casesData),
            borderWidth: 2,
            backgroundColor: "rgba(6, 167, 125, 0.1)",
            borderColor: "rgba(6, 167, 125, 1)",
            pointBackgroundColor: "rgba(225, 225, 225, 1)",
            pointBorderColor: "rgba(6, 167, 125, 1)",
            pointHoverBackgroundColor: "rgba(6, 167, 125, 1)",
            pointHoverBorderColor: "#fff"
         }, {
            label: "Recovered",
            data: Object.values(recoveredData),
            borderWidth: 2,
            backgroundColor: "rgba(26, 143, 227, 0.1)",
            borderColor: "rgba(26, 143, 227, 1)",
            pointBackgroundColor: "rgba(225, 225, 225, 1)",
            pointBorderColor: "rgba(26, 143, 227, 1)",
            pointHoverBackgroundColor: "rgba(26, 143, 227, 1)",
            pointHoverBorderColor: "#fff"
         }, {
            label: "Deaths",
            data: Object.values(deathsData),
            borderWidth: 2,
            backgroundColor: "rgba(246, 71, 64, 0.1)",
            borderColor: "rgba(246, 71, 64, 1)",
            pointBackgroundColor: "rgba(225, 225, 225, 1)",
            pointBorderColor: "rgba(246, 71, 64, 1)",
            pointHoverBackgroundColor: "rgba(246, 71, 64, 1)",
            pointHoverBorderColor: "#fff"
         }]
      },
      options: {
        legend: {
          onClick: (e) => e.stopPropagation()
        },
        elements: {
          line: {
            borderJoinStyle: 'round'
          }
        },
        scales: {
          yAxes: [{
            type: 'logarithmic',
            ticks: {
                 min: 0,
                 max:  Object.values(casesData).pop() * 2,
                 callback: function (value, index, values) {
                    if (value === 1000000000) return "1B";
                    if (value === 1000000) return "1M";
                     if (value === 100000) return "100K";
                     if (value === 10000) return "10K";
                     if (value === 1000) return "1K";
                     if (value === 100) return "100";
                     if (value === 10) return "10";
                     if (value === 0) return "0";
                     return null;
                 }
            }
          }]
        }
      }
   });
   countriesGraph = new Chart(LINE_CHART, {
    type: 'line',
    data: {
       labels: Object.keys(casesData),
        datasets: [{
           label: "Cases",
           data: Object.values(casesData),
           borderWidth: 2,
           backgroundColor: "rgba(6, 167, 125, 0.1)",
           borderColor: "rgba(6, 167, 125, 1)",
           pointBackgroundColor: "rgba(225, 225, 225, 1)",
           pointBorderColor: "rgba(6, 167, 125, 1)",
           pointHoverBackgroundColor: "rgba(6, 167, 125, 1)",
           pointHoverBorderColor: "#fff"
        }, {
           label: "Recovered",
           data: Object.values(recoveredData),
           borderWidth: 2,
           backgroundColor: "rgba(26, 143, 227, 0.1)",
           borderColor: "rgba(26, 143, 227, 1)",
           pointBackgroundColor: "rgba(225, 225, 225, 1)",
           pointBorderColor: "rgba(26, 143, 227, 1)",
           pointHoverBackgroundColor: "rgba(26, 143, 227, 1)",
           pointHoverBorderColor: "#fff"
        }, {
           label: "Deaths",
           data: Object.values(deathsData),
           borderWidth: 2,
           backgroundColor: "rgba(246, 71, 64, 0.1)",
           borderColor: "rgba(246, 71, 64, 1)",
           pointBackgroundColor: "rgba(225, 225, 225, 1)",
           pointBorderColor: "rgba(246, 71, 64, 1)",
           pointHoverBackgroundColor: "rgba(246, 71, 64, 1)",
           pointHoverBorderColor: "#fff"
        }]
     },
     options: {
      elements: {
         line: {
           borderJoinStyle: 'round'
         }
       }
     }
  });
}

function sortCountries(string){
  if (string == "default"){
    setTable(countriesData, "countriesTable")
    return true;
  }else if (string == "alphabetically"){
    sortedCountries = countriesData.slice().sort((a, b) => b.country < a.country);
  }
  else if (string == "reverse-alphabetically"){
    sortedCountries = countriesData.slice().sort((a, b) => b.country > a.country);
  }
  else if (string == "confirmed"){
    sortedCountries = countriesData.slice().sort((a, b) => b.confirmed - a.confirmed);
  }  
  else if (string == "recovered"){
    sortedCountries = countriesData.slice().sort((a, b) => b.recovered - a.recovered);
  }
  else if (string == "deaths"){
    sortedCountries = countriesData.slice().sort((a, b) => b.deaths - a.deaths);
  }
  setTable(sortedCountries, "countriesTable");
}

function setTable(sortedList, elementId){
  var table = document.getElementById(elementId);
  table.innerHTML = "";
  var a = 0;
  for (var i = 0; i < sortedList.length; i++){
    var row = table.insertRow(a);
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    cell1.innerHTML = sortedList[i]["country"];
    cell2.innerHTML = sortedList[i]["confirmed"];
    cell3.innerHTML = sortedList[i]["recovered"];
    cell4.innerHTML = sortedList[i]["deaths"];
    a++;
  }
}
