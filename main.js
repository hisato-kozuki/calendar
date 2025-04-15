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

// let url = "https://script.google.com/macros/s/AKfycbwq5Atva1p_YEi8403zAfTc3HmqUi7B_tUyiBI105CXYbL_-V4RpDXNtJo_iFrPHd_G6w/exec"; // GASで取得したウェブアプリのURL
const date = new Date();
let colorcode = [0, "#7986CB","#33B679","#8E24AA","#E67C73","#F6BF26","#F4511E","#039BE5","#616161","#3F51B5","#0B8043","#D50000"];
let events;
const data = {
    'date_start': [date.getFullYear(), date.getMonth(), date.getDate()],
    'date_end': [date.getFullYear(), date.getMonth()+2, date.getDate()]
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
    let received_data;
    fetch(url, options)
    .then(response => response.text())
    .then(data => {console.log(data);console.log(received_data=JSON.parse(data));dbsave(received_data);display(received_data);})
    .catch(error => console.error("Error:", error));
}

function display(events){
    let date="", titles="";
    
    for(let i = 0; i < events.length; i++){
        date += events[i].year + "/" + (events[i].month+1).toString().padStart(2, "0") + "/" + events[i].date.toString().padStart(2, "0") + "  " + events[i].hour.toString().padStart(2, "0") + "\n";
        let color = colorcode[events[i].color];
        if(color == undefined)color = "#404040";
        titles += "<span style='color: " + color + "'>" + events[i].title +"</span><br>";
    }
    document.getElementsByClassName("date_container")[0].innerText = date;
    document.getElementsByClassName("event_container")[0].innerHTML= titles;
}

document.getElementById("form").addEventListener('submit', (event) => {
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
    console.log(document.getElementById("form").color.value,)
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
    .then(data => {JSON.parse(data);alert(data)})
    .catch(error => console.error("Error:", error));;
});

document.getElementById("form2").addEventListener('submit', event => {
    // イベントを停止する
    event.preventDefault();
    url=document.getElementById("form2").url.value;
    document.getElementById("form2").style.visibility="hidden";
    urlsave(url);
    get_events();
});

window.onload = async function(){
    urlget();
    dbget();
    
    document.getElementById("form").y.value = date.getFullYear();
    document.getElementById("form").m.value = date.getMonth()+1;
    document.getElementById("form").d.value = date.getDate();
    document.getElementById("form").h_s.value = date.getHours();
    document.getElementById("form").h_e.value = date.getHours();
}

async function dbget(){
    var dbName = 'sampleDB';
    var dbVersion = '1';
    var storeName  = 'calendar';
    //　DB名を指定して接続
    var openReq  = indexedDB.open(dbName, dbVersion);
    // 接続に失敗
    openReq.onerror = function (event) {
        console.log('接続失敗');
    }
    
    //DBのバージョン更新(DBの新規作成も含む)時のみ実行
    openReq.onupgradeneeded = function (event) {
        var db = event.target.result;
        const objectStore = db.createObjectStore(storeName, {keyPath : 'id'});
        objectStore.createIndex("id", "id", { unique: true });
        objectStore.createIndex("events", "events", { unique: false });

        console.log('DB更新');
    }

    //onupgradeneededの後に実行。更新がない場合はこれだけ実行
    openReq.onsuccess = function (event) {
        var db = event.target.result;
        var trans = db.transaction(storeName, "readwrite");
        var store = trans.objectStore(storeName);
        var getReq_g = store.get(1);

        getReq_g.onsuccess = function (event) {
            if (typeof event.target.result != 'undefined') {
                let events = event.target.result.events;
                console.log(event);
                display(events);
                return new Promise((resolve)=>resolve(100));
            }
        }
    }
}

function dbsave(received_data){
    console.log("events to save:"+received_data)

    var dbName = 'sampleDB';
    var dbVersion = '1';
    var storeName  = 'calendar';
    var openReq  = indexedDB.open(dbName, dbVersion);
    openReq.onerror = function (event) {
        console.log('接続失敗');
    }
    
    openReq.onsuccess = function (event) {
        console.log("events to save:"+received_data)
        var db = event.target.result;
        var trans = db.transaction(storeName, "readwrite");
        var store = trans.objectStore(storeName);
        var putReq = store.put({
            id: 1,
            events: received_data
        });

        putReq.onsuccess = function (event) {
            console.log('更新成功');
        }
    }
}

async function urlget(){
    var dbName = 'GasUrlDB';
    var dbVersion = '1';
    var storeName  = 'url';
    //　DB名を指定して接続
    var openReq  = indexedDB.open(dbName, dbVersion);
    // 接続に失敗
    openReq.onerror = function (event) {
        console.log('接続失敗');
    }
    
    //DBのバージョン更新(DBの新規作成も含む)時のみ実行
    openReq.onupgradeneeded = function (event) {
        var db = event.target.result;
        const objectStore = db.createObjectStore(storeName, {keyPath : 'id'});
        objectStore.createIndex("id", "id", { unique: true });
        objectStore.createIndex("url", "url", { unique: false });

        console.log('DB更新');
    }

    //onupgradeneededの後に実行。更新がない場合はこれだけ実行
    openReq.onsuccess = function (event) {
        var db = event.target.result;
        var trans = db.transaction(storeName, "readwrite");
        var store = trans.objectStore(storeName);
        var getReq_g = store.get(1);

        getReq_g.onsuccess = function (event) {
            if (typeof event.target.result != 'undefined') {
                let stored_url = event.target.result.url;
                url = stored_url;
                console.log(url);
                get_events();
                return new Promise((resolve)=>resolve(100));
            }
            else{
                document.getElementById("form2").style.visibility="visible";
            }
        }
    }
}

function urlsave(url){
    var dbName = 'GasUrlDB';
    var dbVersion = '1';
    var storeName  = 'url';
    var openReq  = indexedDB.open(dbName, dbVersion);
    openReq.onerror = function (event) {
        console.log('接続失敗');
    }
    
    openReq.onsuccess = function (event) {
        var db = event.target.result;
        var trans = db.transaction(storeName, "readwrite");
        var store = trans.objectStore(storeName);
        var putReq = store.put({
            id: 1,
            url: url
        });

        putReq.onsuccess = function (event) {
            console.log('更新成功');
        }
    }
}