if ('serviceWorker' in navigator) {
    // Wait for the 'load' event to not block other work
    window.addEventListener('load', async () => {
      // Try to register the service worker.
      try {
        const reg = await navigator.serviceWorker.register('./service-worker.js');
        console.log('Service worker registered! 😎', reg);
      } catch (err) {
        console.log('😥 Service worker registration failed: ', err);
      }
    });
}

const url = "https://script.google.com/macros/s/AKfycbxpAN4lSL-DfTKabn8BC-afeMzzds9ArVBg_TxEQ_V05kyI3dBeROupekZVmjpoXPo5Cg/exec"; // GASで取得したウェブアプリのURL
const date = new Date();

let year_end=year_start=date.getFullYear(), month_start=date.getMonth(), day_end=day_start=date.getDate(), month_end=month_start+2;

let events;
const data = {
    'date_start': [year_start, month_start, day_start],
    'date_end': [year_end, month_end, day_end]
};
const options = {
    'method' : 'post',
    'headers': {
        'Content-Type': "application/x-www-form-urlencoded",
    },
    'body' : JSON.stringify(data) //送りたいデータをpayloadに配置してJSON形式変換。
};
function get_events(){
    //res = UrlFetchApp.fetch(url,options); // <- Post リクエスト
    fetch(url, options)
    .then(response => response.text())
    .then(data => {console.log(data);console.log(events=JSON.parse(data));display(events);})
    .catch(error => console.error("Error:", error));
}

function display(events){
    let date="", titles="";
    for(let i = 0; i < events.length; i++){
        date += events[i].year + "/" + (events[i].month+1).toString().padStart(2, "0") + "/" + events[i].date.toString().padStart(2, "0") + "/" + events[i].hour.toString().padStart(2, "0") + "\n";
        titles += events[i].title + "\n";
    }
    document.getElementsByClassName("date_container")[0].innerText = date;
    document.getElementsByClassName("event_container")[0].innerText = titles;
}

document.getElementById("form").addEventListener('submit', event => {
    // イベントを停止する
    event.preventDefault();
    let url_=url + "?";
    console.log(document.getElementById("form").y.value);
    const data = {
        'title': document.getElementById("form").title.value,
        'y': document.getElementById("form").y.value,
        'm': document.getElementById("form").m.value,
        'd': document.getElementById("form").d.value,
        'h_s': document.getElementById("form").h_s.value,
        'h_e': document.getElementById("form").h_e.value,
    };
    for(key in data){
        url_ += key + "=" + data[key] + "&";
    }
    const options = {
        'method' : 'get',
        'headers': {
            'Content-Type': "application/x-www-form-urlencoded",
        },
    };
    fetch(url_, options)
    .then(response => response.text())
    .then(data => JSON.parse(data))
    .catch(error => console.error("Error:", error));;
});

window.onload = function(){
    get_events();
    document.getElementById("form").y.value = date.getFullYear();
    document.getElementById("form").m.value = date.getMonth()+1;
    document.getElementById("form").d.value = date.getDate();
    document.getElementById("form").h_s.value = date.getHours();
    document.getElementById("form").h_e.value = date.getHours();
}
