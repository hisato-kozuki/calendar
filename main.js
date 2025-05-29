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

let colorcode = [0, "#7986CB","#33B679","#8E24AA","#E67C73","#F6BF26","#F4511E","#039BE5","#616161","#3F51B5","#0B8043","#D50000"];
let events;
let url;

const options = {
    'method' : 'post',
    'headers': {
        'Content-Type': "application/x-www-form-urlencoded",
    },
    'body' : '' //送りたいデータをpayloadに配置してJSON形式変換。
};

window.onload = function(){
    const date = new Date();
    urlget();
    dbget();
    let text = date_string(date, "-", 0, true, true);
    document.getElementById("form").start.value = text;
    document.getElementById("form").end.value = text;
    document.getElementById("form3").start.value = date_string(date, "-", 0, true, false);
    document.getElementById("form3").end.value = date_string(date, "-", 2, true, false);;
}

function date_string(date, separator, month_offset, year_required, hour_required){
    let date_string = "";
    if(year_required)date_string += date.getFullYear().toString();
    date_string += separator + (date.getMonth() + month_offset + 1).toString().padStart(2, "0")
    date_string += separator + date.getDate().toString().padStart(2, "0")
    if(hour_required && separator == "-")date_string += "T" + date.getHours().toString() + ":00";
    if(hour_required && separator == "/")date_string += " " + date.getHours().toString() + ":" + date.getMinutes().toString().padStart(2, "0");
    return date_string;
}

function get_events(date_start, date_end){
    //res = UrlFetchApp.fetch(url,options); // <- Post リクエスト
    if(date_start == undefined){
        date_start = new Date();
        date_end =  new Date();
        date_start.setDate(date_start.getDate()-1);
        date_start.setHours(0);
        date_end.setMonth(date_end.getMonth()+2);
    }
    const data = {
        'type': "get",
        'date_start': date_start,
        'date_end': date_end
    };
    options.body=JSON.stringify(data);
    let received_data;
    fetch(url, options)
    .then(response => response.text())
    .then(data => {
        dbsave(received_data=JSON.parse(data));console.log(received_data);display(received_data);
        document.getElementById("postbutton").innerText = "送信";
        document.getElementById("getbutton").innerText = "リロード";
    })
    .catch(error => console.error("Error:", error));
}

function post_event(data){
    //res = UrlFetchApp.fetch(url,options); // <- Post リクエスト
    let received_data;
    options.body=JSON.stringify(data);

    fetch(url, options)
    .then(response => response.text())
    .then(data => {
        console.log(data);get_events();
        document.getElementById("postbutton").innerText = "完了";
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
        console.log(data);get_events();
        delete_cell.innerText = "完了";
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
        let dot = document.createElement("p");
        let div = document.createElement("div");
        date_cell.className = "date_cell";
        event_cell.className = "event_cell";
        div.style.display = "flex";
        let date_start = new Date(events[i].date_start);
        let date_end = new Date(events[i].date_end);
        dot.innerText = "◆"; dot.style.margin = "0px"; dot.style.fontSize = "20px";
        dot.style.width = "3%"; dot.style.alignSelf = "center"; dot.style.textAlign = "center";
        if ((date_start.getDay()+6)%7 == 6)dot.style.color = "orangered";
        else if ((date_start.getDay()+6)%7 == 5)dot.style.color = "darkturquoise";
        else dot.innerText = "";
        div.appendChild(dot);
        date_cell.innerText = date_string(date_start, "/", 0, true, true);
        if(date_start.getFullYear() != date_end.getFullYear()){
            date_cell.innerText += "\n～" + date_string(date_end, "/", 0, true, true);
        }else if(date_start.getMonth() != date_end.getMonth() || date_start.getDate() != date_end.getDate()){
            date_cell.innerText += "\n～" + date_string(date_end, "/", 0, false, true);
        }else if(date_start.getHours() != date_end.getHours()){
            date_cell.innerText += "～" + date_end.getHours().toString().padStart(2, "0") + ":00";
        }
        let color = colorcode[events[i].color];
        if(color == undefined)color = "#404040";
        event_cell.innerHTML = "<span style='color: " + color + "'>" + events[i].title +"</span><br>";
        div.appendChild(date_cell);
        div.appendChild(event_cell);
        let delete_cell = document.createElement("button");
        delete_cell.className = "delete_cell";
        delete_cell.innerText = "削除";
        delete_cell.addEventListener('click', () => {
            var result = confirm("本当に\""+events[i].title+"\"を削除しますか？");
            if(result){
                const data = {
                    'type': "delete",
                    'id': events[i].id
                };
                delete_cell.innerText = "……";
                delete_event(data);
            }
        });
        div.appendChild(delete_cell);
        if(i){
            let date_new = new Date(events[i].date_start);
            let date_old = new Date(events[i-1].date_start);
            if(Math.floor(((date_new - date_old)/3600000 + date_old.getHours())/24) - (date_new.getDay()+6)%7 >= 1){
                let div = document.createElement("div");
                div.style.borderBottom = "solid 1px gray";
                cell.appendChild(div);
            }
        }
        cell.appendChild(div);
    }

    // console.log("cell classname",cell.style.className);
    document.getElementsByClassName("container")[0].appendChild(cell);
}

document.getElementById("form").addEventListener('submit', (event) => {
    // イベントを停止する
    event.preventDefault();
    let date_start = new Date(Date.parse(document.getElementById("form").start.value));
    let date_end = new Date(Date.parse(document.getElementById("form").end.value));
    console.log(date_start, date_start.toLocaleString(), date_start.toDateString())
    const data = {
        'type': 'post',
        'title': document.getElementById("form").title.value,
        'date_start': date_start,
        'date_end': date_end,
        'color': document.getElementById("form").color.value,
    };
    if(data.title != ""){
        document.getElementById("postbutton").innerText = "……";
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

document.getElementById("form3").addEventListener('submit', event => {
    // イベントを停止する
    event.preventDefault();
    let date_start = new Date(Date.parse(document.getElementById("form3").start.value));
    let date_end = new Date(Date.parse(document.getElementById("form3").end.value));
    document.getElementById("getbutton").innerText = "……";
    get_events(date_start, date_end);
});

async function dbget(){
    db_operation("get", "calendar");
}

function dbsave(received_data){
    db_operation("save", "calendar", received_data);
}

async function urlget(){
    db_operation("get", "url");
}

function urlsave(url){
    db_operation("save", "url", url);
}

function db_operation(mode, storeName, received_data){
    var dbName;
    if(storeName=="calendar")dbName = 'sampleDB';
    if(storeName=="url")dbName = 'GasUrlDB';
    var dbVersion = '1';
    //　DB名を指定して接続
    var openReq  = indexedDB.open(dbName, dbVersion);
    // 接続に失敗
    openReq.onerror = function (event) {
        console.log('接続失敗');
    }
    if(mode=="get"){
        //DBのバージョン更新(DBの新規作成も含む)時のみ実行
        openReq.onupgradeneeded = function (event) {
            var db = event.target.result;
            const objectStore = db.createObjectStore(storeName, {keyPath : 'id'});
            objectStore.createIndex("id", "id", { unique: true });
            if(storeName=="calendar")objectStore.createIndex("events", "events", { unique: false });
            if(storeName=="url")objectStore.createIndex("url", "url", { unique: false });

            console.log('DB更新');
        }
    }

    //onupgradeneededの後に実行。更新がない場合はこれだけ実行
    openReq.onsuccess = function (event) {
        var db = event.target.result;
        var trans = db.transaction(storeName, "readwrite");
        var store = trans.objectStore(storeName);
        if(mode=="get"){
            var getReq_g = store.get(1);
            getReq_g.onsuccess = function (event) {
                if (typeof event.target.result != 'undefined') {
                    if(storeName=="calendar"){
                        let events = event.target.result.events;
                        console.log(event);
                        display(events);
                    }
                    if(storeName=="url"){
                        let stored_url = event.target.result.url;
                        url = stored_url;
                        console.log("stored_url",url);
                        get_events();
                    }
                    return new Promise((resolve)=>resolve(100));
                }else{
                    if(storeName=="url")document.getElementById("form2").style.visibility="visible";
                }
            }
        }
        if(mode="save"){
            if(storeName=="calendar"){
                var putReq = store.put({
                    id: 1,
                    events: received_data
                });
            }
            if(storeName=="url"){
                var putReq = store.put({
                    id: 1,
                    url: received_data
                });

            }
            putReq.onsuccess = function (event) {
                console.log('更新成功');
            }
        }
    }
}