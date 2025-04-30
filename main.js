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

const date = new Date();
let colorcode = [0, "#7986CB","#33B679","#8E24AA","#E67C73","#F6BF26","#F4511E","#039BE5","#616161","#3F51B5","#0B8043","#D50000"];
let events;

const options = {
    'method' : 'post',
    'headers': {
        'Content-Type': "application/x-www-form-urlencoded",
    },
    'body' : '' //送りたいデータをpayloadに配置してJSON形式変換。
};

function get_events(){
    //res = UrlFetchApp.fetch(url,options); // <- Post リクエスト
    const data = {
        'type': "get",
        'date_start': [date.getFullYear(), date.getMonth(), date.getDate()],
        'date_end': [date.getFullYear(), date.getMonth()+2, date.getDate()]
    };    
    options.body=JSON.stringify(data);
    let received_data;
    fetch(url, options)
    .then(response => response.text())
    .then(data => {dbsave(received_data=JSON.parse(data));console.log(received_data);display(received_data);})
    .catch(error => console.error("Error:", error));
}

function post_event(data){
    //res = UrlFetchApp.fetch(url,options); // <- Post リクエスト
    let received_data;
    options.body=JSON.stringify(data);

    fetch(url, options)
    .then(response => response.text())
    .then(data => {
        console.log(data);console.log();alert(data);get_events();
        document.getElementById("postbutton").innerText = "送信";
    })
    .catch(error => console.error("Error:", error));
}

function delete_event(data){
    //res = UrlFetchApp.fetch(url,options); // <- Post リクエスト
    let received_data;
    options.body=JSON.stringify(data);

    fetch(url, options)
    .then(response => response.text())
    .then(data => {
        console.log(data);console.log();alert(data);get_events();
        delete_cell.innerText = "削除";
    })
    .catch(error => console.error("Error:", error));
}

function display(events){
    if(document.getElementById("cell"))document.getElementById("cell").remove();
    let cell = document.createElement("div");
    cell.id = "cell";
    cell.style.width = "100%";

    for(let i = 0; i < events.length; i++){
        let date_cell = document.createElement("div");
        let event_cell = document.createElement("div");
        let div = document.createElement("div");
        date_cell.className = "date_cell";
        event_cell.className = "event_cell";
        div.style.display = "flex";
        date_cell.innerText = events[i].year + "/" + (events[i].month+1).toString().padStart(2, "0") + "/" + events[i].date.toString().padStart(2, "0") + "  " + events[i].hour.toString().padStart(2, "0") + "\n";
        let color = colorcode[events[i].color];
        if(color == undefined)color = "#404040";
        event_cell.innerHTML = "<span style='color: " + color + "'>" + events[i].title +"</span><br>";
        div.appendChild(date_cell);
        div.appendChild(event_cell);
        let delete_cell = document.createElement("button");
        delete_cell.className = "delete_cell";
        delete_cell.innerText = "削除";
        delete_cell.addEventListener('click', () => {
            var result = confirm("本当に削除しますか？");
            if(result){
                const data = {
                    'type': "delete",
                    'id': events[i].id
                };
                delete_cell.innerText = "お待ちください。";
                delete_event(data);
            }
        });
        div.appendChild(delete_cell);
        cell.appendChild(div);
    }

    console.log(cell.style.className);
    document.getElementsByClassName("container")[0].appendChild(cell);
}

document.getElementById("form").addEventListener('submit', (event) => {
    // イベントを停止する
    event.preventDefault();
    const data = {
        'type': 'post',
        'title': document.getElementById("form").title.value,
        'y': document.getElementById("form").y.value,
        'm': document.getElementById("form").m.value,
        'd': document.getElementById("form").d.value,
        'h_s': document.getElementById("form").h_s.value,
        'h_e': document.getElementById("form").h_e.value,
        'color': document.getElementById("form").color.value,
    };
    if(data.title != ""){
        document.getElementById("postbutton").innerText = "お待ちください。";
        post_event(data);
    }
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
    var dbName = 'sampleDB';
    var dbVersion = '1';
    var storeName  = 'calendar';
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