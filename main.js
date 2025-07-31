if ('serviceWorker' in navigator) {
    // Wait for the 'load' event to not block other work
    window.addEventListener('load', async () => {
      // Try to register the service worker.
        navigator.serviceWorker.register('./service-worker.js')
        .then(function(reg){console.log('Service worker registered! 😎', reg);
        }).catch (function(err){
            console.log('😥 Service worker registration failed: ', err);
        });
    });
}

const date = new Date();
let todayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
let colorCodes = [0, "#7986CB","#33B679","#E67C73","#F6BF26","#F4511E","#039BE5","#616161","#3F51B5","#0B8043","#D50000"];
let eventList;
let apiUrl;
let urlLinks = {};//よく使うサイトのリンク
const days = ["月", "火", "水", "木", "金", "土", "日"];
let studyTimeSeconds=0, hobbyTimeSeconds=0;
let isStudying=false, isHavingHobby=false;

const options = {
    'method' : 'post',
    'headers': {
        'Content-Type': "application/x-www-form-urlencoded",
    },
    'body' : '' //送りたいデータをpayloadに配置してJSON形式変換。
};

window.onload = function(){
    let text = date_string(todayDate, "-", 0, true, true);
    document.getElementById("form").start.value = text;
    document.getElementById("form").end.value = text;
    document.getElementById("form3").start.value = date_string(date, "-", 0, true, false);
    document.getElementById("form3").end.value = date_string(date, "-", 2, true, false);
    urlget();
    getCalendarEventsFromDB();
    if(localStorage.getItem("links")){
        urlLinks = JSON.parse(localStorage.getItem("links"));
        let key = Object.keys(urlLinks);
        for(let i = 0; i < key.length; i++){
            document.getElementById("urls").innerHTML += "<p style='font-size:20px'><a href='" + urlLinks[key[i]] + "'>" + key[i] + "</a></p>";
        }
    }
    countUpTimer(true, true);countUpTimer(false, true);
}

function date_string(date, separator, month_offset, year_required, hour_required){
    let date_string = "";
    date.setMonth(date.getMonth() + month_offset);
    if(year_required)date_string += date.getFullYear().toString();
    date_string += separator + (date.getMonth() + 1).toString().padStart(2, "0")
    date_string += separator + date.getDate().toString().padStart(2, "0")
    if(hour_required && separator == "-")date_string += "T" + date.getHours().toString().padStart(2, "0") + ":00";
    if(hour_required && separator == "/")date_string += " " + date.getHours().toString() + ":" + date.getMinutes().toString().padStart(2, "0");
    return date_string;
}

function get_events(startDate, endDate){
    return new Promise((resolve, reject) => {
            //res = UrlFetchApp.fetch(apiUrl,options); // <- Post リクエスト
        if(startDate == undefined){
            startDate = new Date();
            endDate =  new Date();
            startDate.setDate(startDate.getDate()-1);
            startDate.setHours(0);
            endDate.setMonth(endDate.getMonth()+2);
        }
        const data = {
            'type': "get",
            'date_start': startDate,
            'date_end': endDate
        };
        options.body=JSON.stringify(data);
        fetch(apiUrl, options)
        .then(response => response.text())
        .then(data => {
            let received_data=JSON.parse(data);
            document.getElementById("postbutton").innerText = "送信";
            document.getElementById("getbutton").innerText = "完了";
            resolve(received_data);
        })
        .catch(error => {
            console.log("reload not complete")
            console.error("Error:", error);
            document.getElementById("p").innerText = error;
            document.getElementById("getbutton").innerText = "Error";
            reject(error);
        });
    });
}

function post_event(data, get_required){
    return new Promise((resolve, reject) => {
        //res = UrlFetchApp.fetch(apiUrl,options); // <- Post リクエスト
        let received_data;
        options.body=JSON.stringify(data);

        fetch(apiUrl, options)
        .then(response => response.text())
        .then(data => {
            // console.log(data);
            resolve(true);
            if(get_required){
                cellPendingAnimation(document.getElementById("getbutton"), "getbutton");
                get_events().then((data)=>{display(data, true);saveCalendarEventsToDB(data);
            console.log("post events 完了")});
            }
        })
        .catch(error => {
            console.error("Error:", error);
            document.getElementById("p").innerText = error;
            reject(false);
            document.getElementById("postbutton").innerText = "Error";
        });
    })
}

function delete_event(data, delete_cell){
    //res = UrlFetchApp.fetch(apiUrl,options); // <- Post リクエスト
    let received_data;
    options.body=JSON.stringify(data);

    fetch(apiUrl, options)
    .then(response => response.text())
    .then(data => {
        // console.log(received_data=JSON.parse(data));
        // console.log(data);
        if(delete_cell != undefined)delete_cell.innerText = "完了";
    })
    .catch(error => {
        console.error("Error:", error);
        document.getElementById("p").innerText = error;
        delete_cell.innerText = "Error";
    });
}

function createE(tag, classname, id, text){
    let element = document.createElement(tag);
    element.className = classname;
    element.id = id;
    if(text != undefined)element.innerText = text;
    return element;
}

function display(events, task_renew_required){
    if(document.getElementById("cell"))document.getElementById("cell").remove();
    let cell = createE("div", "small_container", "cell");
    let date_start = new Date(Date.parse(document.getElementById("form3").start.value));
    let date_end = new Date(Date.parse(document.getElementById("form3").end.value));
    date_start.setDate(date_start.getDate()-(date_start.getDay()+5)%7-1);
    date_end.setDate(date_end.getDate()+(7-date_end.getDay())%7);
    let display_none_cells = new Array((date_end-date_start)/86400000);
    let timelines = new Array((date_end-date_start)/86400000);
    for(let date_monday = new Date(date_start), i = 0; date_monday <= date_end; date_monday.setDate(date_monday.getDate()+7), i++){
        let week_cell = createE("div", "week_cell", "");
        // let time_index = createE("div", "time_index");
        // for(let j = 0; j < 8; j++){
        //     let memori = createE("div", "div");
        //     memori.style.width = "100%";
        //     memori.style.borderBottom = "solid black 1px";
        //     time_index.appendChild(memori)
        // }
        // week_cell.appendChild(time_index);
        let date = new Date(date_monday);
        for(let j = 0; j < 7; j++){
            // let date_start = new Date(events[i].date_start);
            // let date_end = new Date(events[i].date_end);
            let day_cell = createE("div", "day_cell", "");
            let date_index_cell = createE("div", "date_index_cell", "", date.getMonth()+1+"/"+date.getDate()+"("+days[j]+")");
            if ((date.getDay()+6)%7 == 6)date_index_cell.style.color = "orangered";
            else if ((date.getDay()+6)%7 == 5)date_index_cell.style.color = "darkturquoise";
            let day_div = createE("div", "div");
            let display_none_cell = createE("div", "display_none_cell");
            let timeline = createE("div", "timeline");
            day_cell.appendChild(date_index_cell);
            day_cell.appendChild(timeline);
            display_none_cell.appendChild(day_cell);
            day_div.appendChild(display_none_cell);
            week_cell.appendChild(day_div);
            display_none_cells[7*i+j] = display_none_cell;
            timelines[7*i+j] = timeline;
            for(let k= 0; k<5; k++){
                let line = createE("div", "display_none_cell");
                line.style.borderTop = "dotted #808080 1px";
                line.style.gridRow = 3*(k+1)+1;
                line.style.gridColumn = "1/6";
                timeline.appendChild(line);
            }
            date.setDate(date.getDate()+1);
        }
        cell.appendChild(week_cell);
    }
    let skip = 0;
    let duplicate_a = 0;
    let duplicate_b = 0;
    let mondayStartDate = new Date(Date.parse(document.getElementById("form3").start.value));
    mondayStartDate.setDate(mondayStartDate.getDate()-(mondayStartDate.getDay()+5)%7-1);
    mondayStartDate.setHours(0);
    let oldStartDate;
    let oldStartHour;
    let date_end_long = new Array(5);
    let event_container_containers = new Array((date_end-date_start)/86400000*18);
    for(let i = 0; i < events.length; i++){
        if(events[i].color != 3){
            // console.log(events[i].date_start)
            let date_start = new Date(events[i].date_start);
            let date_end = new Date(events[i].date_end);
            let date_cell = createE("div", "date_cell", "", date_start.getHours().toString() + ":" + date_start.getMinutes().toString().padStart(2, "0"));
            let event_cell = createE("div", "event_cell");
            let event_container = createE("div", "event_container", "");
            if(date_start.getFullYear() != date_end.getFullYear()){
                date_cell.innerText += "\n～" + date_string(date_end, "/", 0, true, true);
            }else if(date_start.getMonth() != date_end.getMonth() || date_start.getDate() != date_end.getDate()){
                date_cell.innerText += "\n～" + date_string(date_end, "/", 0, false, true);
            }else if(date_start.getHours() != date_end.getHours()){
                date_cell.innerText += "～" + date_end.getHours().toString().padStart(2, "0") + ":00";
            }
            let color = colorCodes[events[i].color];
            event_cell.innerText = events[i].title;
            if(color == undefined)color = "#404040";
            if(events[i].color == 4 || events[i].color == 1 || events[i].color == 9){
                event_cell.innerHTML = "<span style='color:"+color+"'>◆ </span>"+event_cell.innerHTML;
                // console.log((date_start - todayDate)/3600000);
                if(task_renew_required){
                    if(events[i].color == 4 && date_start - todayDate < 86400000){ // 現在日程の一日後より前の時刻の場合に
                        renewTask(events[i], date_start, 4);
                    }
                    if(events[i].color == 1 && date_start - todayDate < 172800000){ // 現在日程の2日後より前の時刻の場合に
                        renewTask(events[i], date_start, 1);
                    }
                    if(events[i].color == 9 && date_start - todayDate < 604800000){ // 現在日程の１週間後より前の時刻の場合に
                        renewTask(events[i], date_start, 9);
                    }
                }
            }
            else event_cell.style.color = color;
            event_container.appendChild(date_cell);
            event_container.appendChild(event_cell);
            let delete_cell = createE("button", "delete_cell", "", "削除");
            delete_cell.addEventListener('click', () => {
                var result = confirm("本当に\""+events[i].title+"\"を削除しますか？");
                if(result){
                    const data = {
                        'type': "delete",
                        'id': events[i].id
                    };
                    cellPendingAnimation(delete_cell)
                    delete_event(data, delete_cell);
                }
            });
            event_container.appendChild(delete_cell);
            let date_start_0 = new Date(date_start.getFullYear(), date_start.getMonth(), date_start.getDate());
            // console.log(date_start,mondayStartDate);
            // console.log((date_start_0-mondayStartDate)/86400000);
            // event_container.style.top = (date_start.getHours()/24*350+30)+"px";
            startHour = Math.min(Math.max(date_start.getHours()-5, 1), 20);
            endHour= Math.min(Math.max(date_end.getHours()-5, startHour+1), 20);
            if(i){
                if(date_start.getDate() == oldStartDate.getDate() && startHour == oldStartHour)duplicate_a += 1;
                else duplicate_a = 0;
                if(duplicate_b && date_end_long[duplicate_b-1] < date_start){
                    console.log(date_end_long[duplicate_b-1])
                    duplicate_b -= 1;
                }
                console.log(duplicate_a,duplicate_b)
            }
            let duplicate = duplicate_a + duplicate_b + 1;
            let i_hour = Math.max((date_start_0-mondayStartDate)/86400000, 0)*18+Math.min(Math.max(date_start.getHours()-5, 1), 20);
            if(date_start_0 < mondayStartDate)i_hour = 0;
            if(event_container_containers[i_hour] != undefined){
                event_container.style.gridColumn = duplicate+"/6";
                event_container_containers[i_hour].appendChild(event_container);
            } else {
                let event_container_container = createE("div", "event_grid");
                event_container_container.style.gridRow = startHour+"/"+endHour;
                if(date_start_0 < mondayStartDate)event_container_container.style.gridRow = "1/2";
                event_container_container.style.gridColumn = "1/6";
                event_container.style.gridColumn = duplicate+"/6";
                event_container_container.appendChild(event_container);
                event_container_containers[i_hour] = event_container_container;
                timelines[Math.max((date_start_0-mondayStartDate)/86400000, 0)].appendChild(event_container_container);
            }
            let number = (date_start_0-mondayStartDate)/86400000;
            console.log("date_start: ", date_start, "  date_end: ", date_end)
            if(date_start.getDate() == date_end.getDate()){
                createEventBackground(startHour, endHour, duplicate, i, timelines, number, "wide");
            } else {
                date_end_long[duplicate_b] = date_end;
                duplicate_b += 1;
                if(number >= 0){
                    createEventBackground(startHour, startHour+1, duplicate+1, i, timelines, number, "wide");
                    createEventBackground(startHour, 19, duplicate, i, timelines, number);
                }else createEventBackground(1, 2, duplicate+1, i, timelines, 0, "wide");
                let days = Math.floor((date_end - date_start_0)/86400000);
                let j = 1
                for(; j < days; j++){
                    if(number+j >= 0)createEventBackground(1, 19, duplicate, i, timelines, number+j);
                }
                createEventBackground(1, endHour, duplicate, i, timelines, number+j);
            }
            display_none_cells[Math.max((date_start_0-mondayStartDate)/86400000, 0)].style.display = "flex";
            skip = 0;
            oldStartDate = date_start;
            oldStartHour = startHour;
        }else skip++;
    }
    // console.log("cell classname",cell.style.className);
    document.getElementsByClassName("container")[0].appendChild(cell);
}

function renewTask(event_data, date, color){
    console.log("detected");
    let data = {
        'type': "delete",
        'id': event_data.id
    };
    delete_event(data);
    let new_date = date;
    console.log("old_date", new_date);
    if(color == 4)new_date.setDate(date.getDate()+1);
    if(color == 1)new_date.setDate(date.getDate()+7);
    if(color == 9)new_date.setMonth(date.getMonth()+1);
    console.log("new_date", new_date);
    data = {
        'type': 'post',
        'title': event_data.title,
        'date_start': new_date,
        'date_end': new_date,
        'color': color,
    };
    if(data.title != ""){
        document.getElementById("postbutton").innerText = "……";
        post_event(data, 0).then((data) => {
            if(data)document.getElementById("postbutton").innerText = "完了";
            else document.getElementById("postbutton").innerText = "Error";
        });
    }
}

function cellPendingAnimation(cell, type){
    if(cell.innerText == "完了" || cell.innerText == "Error"){
        if(cell.innerText == "完了" && type == "getbutton")cell.innerText = "リロード";
    }else{
        if(cell.innerText == ">")cell.innerText = ">>";
        else if(cell.innerText == ">>")cell.innerText = ">>>";
        else cell.innerText = ">";
        setTimeout(() => cellPendingAnimation(cell, type), 500);
    }
}

function createEventBackground(startHour, endHour, start_column, i, timelines, number, wide){
    let event_back = createE("div", "display_none_cell");
    event_back.style.backgroundColor = "hsla("+i*159+", 100%, 50%, 0.05)";
    event_back.style.border = "solid 0.1px hsla("+i*159+", 100%, 0%, 0.2)";
    event_back.style.gridRow = startHour+"/"+endHour;
    if(wide == "wide"){
        end_column = 6;
        event_back.style.borderLeft = "transparent";
        event_back.style.borderRight = "transparent";
    } else end_column = start_column + 1;
    event_back.style.gridColumn = start_column+"/"+end_column;
    timelines[Math.max(number, 0)].appendChild(event_back);
}

document.getElementById("form").addEventListener('submit', (event) => {
    // イベントを停止する
    let form = document.getElementById("form");
    let button = document.getElementById("postbutton");
    event.preventDefault();
    let date_start = new Date(Date.parse(form.start.value));
    let date_end = new Date(Date.parse(form.end.value));
    console.log(date_start, date_start.toLocaleString(), date_start.toDateString())
    const data = {
        'type': 'post',
        'title': form.title.value,
        'date_start': date_start,
        'date_end': date_end,
        'color': form.color.value,
    };
    if(data.title != "" && button.innerText == "送信"){
        cellPendingAnimation(button);
        post_event(data, 1).then((data) => {
            if(data)document.getElementById("postbutton").innerText = "完了";
            else document.getElementById("postbutton").innerText = "Error";
        });
    }
});

document.getElementById("form2").addEventListener('submit', event => {
    // イベントを停止する
    event.preventDefault();
    apiUrl=document.getElementById("form2").url.value;
    document.getElementById("form2").style.visibility="hidden";
    saveApiUrlToDB(apiUrl);
    get_events().then((data)=>{display(data, true);saveCalendarEventsToDB(data);
            console.log("url更新 完了")
        document.getElementById("getbutton").innerText = "リロード";});
});

document.getElementById("form3").addEventListener('submit', event => {
    // イベントを停止する
    event.preventDefault();
    let date_start = new Date(Date.parse(document.getElementById("form3").start.value));
    let date_end = new Date(Date.parse(document.getElementById("form3").end.value));
    let button = document.getElementById("getbutton");
    if(button.innerText == "リロード"){
        get_events(date_start, date_end).then((data)=>{display(data, true);saveCalendarEventsToDB(data);
            console.log("リロード 完了")});
        cellPendingAnimation(button, "getbutton");
    }else button.innerText = "リロード";
});

document.getElementById("date_default").addEventListener('click', event => {
    // イベントを停止する
    event.preventDefault();
    
    text = document.getElementById("form").start.value;
    console.log(text);
    document.getElementById("form").end.value = text;
});

document.getElementById("urlform").addEventListener('submit', event => {
    // イベントを停止する
    event.preventDefault();
    if(document.getElementById("urlformbutton").innerText=="表示"){
        document.getElementById("urls").style.visibility = "visible";
        document.getElementById("urls").style.height = "fit-content";
        document.getElementById("nameinput").style.visibility = "visible";
        document.getElementById("urlinput").style.visibility = "visible";
        document.getElementById("urlformbutton").innerText="登録";
    }
    else if(document.getElementById("urlformbutton").innerText=="登録"){
        urlLinks[document.getElementById("urlform").name.value] = document.getElementById("formform").url.value;
        localStorage.setItem("links", JSON.stringify(urlLinks));
        document.getElementById("urlformbutton").innerText="完了";
        document.getElementById("urls").innerHTML = "";
        let key = Object.keys(urlLinks);
        for(let i = 0; i < key.length; i++){
            document.getElementById("urls").innerHTML += "<p style='font-size:20px'><a href='" + urlLinks[key[i]] + "'>" + key[i] + "</a></p>";
        }
    }else document.getElementById("urlformbutton").innerText="登録";
});

function getCalendarEventsFromDB(){
    dbOperation("get", "calendar");
}

function saveCalendarEventsToDB(received_data){
    dbOperation("save", "calendar", received_data);
}

function urlget(){
    dbOperation("get", "url");
}

function saveApiUrlToDB(url){
    dbOperation("save", "url", url);
}

function dbOperation(mode, storeName, received_data){
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
                        console.log("stored_event", event);
                        display(events, false);
                    }
                    if(storeName=="url"){
                        let stored_url = event.target.result.url;
                        apiUrl = stored_url;
                        console.log("stored_url",apiUrl);
                        const promise1 = new Promise((resolve) =>get_events().then((data)=>resolve(data)));
                        const promise2 = new Promise((resolve) =>get_events(todayDate, date, false).then((data)=>resolve(data)));
                        let date_old = new Date(todayDate - 86400000);
                        const promise3 = new Promise((resolve) =>get_events(date_old, todayDate, false).then((data)=>resolve(data)));
                        date_old = new Date(todayDate - 604800000);
                        const promise4 = new Promise((resolve) =>get_events(date_old, todayDate, false).then((data)=>resolve(data)));
                        Promise.all([promise1, promise2, promise3, promise4])
                        .then((results) => {
                            display(results[0], true);saveCalendarEventsToDB(results[0]);
                            countHistory(results[1], 2);
                            countHistory(results[2], 3);
                            countHistory(results[3], 4);
                            document.getElementById("getbutton").innerText="リロード";
                            console.log("予定読み込み，履歴読み込み完了");
                        })
                    }
                }else{
                    if(storeName=="url")document.getElementById("form2").style.visibility="visible";
                }
            }
        }
        if(mode=="save"){
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
            // putReq.onsuccess = function (event) {
            //     console.log('更新成功');
            //     console.log("saved:"+received_data);
            // }
        }
    }
}

document.getElementById("studybutton").addEventListener('click', event => {
    if(localStorage.getItem("isstudy") != 1){
        localStorage.setItem("isstudy", 1);
        localStorage.setItem("study_start_date", new Date());
        countUpTimer(false);
    }
    else{
        localStorage.setItem("isstudy", 0);
    }
});

document.getElementById("hobbybutton").addEventListener('click', event => {
    if(localStorage.getItem("ishobby") != 1){
        localStorage.setItem("ishobby", 1);
        localStorage.setItem("hobby_start_date", new Date());
        countUpTimer(true);
    }
    else{
        localStorage.setItem("ishobby", 0);
    }
});

document.getElementById("studysend").addEventListener('click', event => {
    let cell = document.getElementById("studysend");
    if(cell.innerText == "完了")cell.innerText = "送信";
    else{
        data = {
            'type': 'post',
            'title': "sssss"+(localStorage.getItem("studyTimeSeconds")).toString().padStart(5, "0"),
            'date_start': todayDate,
            'date_end': todayDate,
            'color': 3,
        };
        localStorage.setItem("studyTimeSeconds", 0);
        post_event(data, false).then((data) => {
            if(data){
                cell.innerText = "完了";
                document.getElementById("studytimer").innerText = 0;
            }
            else cell.innerText = "Error";
        });
        cellPendingAnimation(cell);
    }
});

document.getElementById("hobbysend").addEventListener('click', event => {
    let cell = document.getElementById("hobbysend");
    if(cell.innerText == "完了")cell.innerText = "送信";
    else{
        data = {
            'type': 'post',
            'title': "hhhhh"+(localStorage.getItem("hobbyTimeSeconds")).toString().padStart(5, "0"),
            'date_start': todayDate,
            'date_end': todayDate,
            'color': 3,
        };
        localStorage.setItem("hobbyTimeSeconds", 0);
        post_event(data, false).then((data) => {
            if(data){
                cell.innerText = "完了";
                document.getElementById("hobbytimer").innerText = 0;
            }
            else cell.innerText = "Error";
        });
        cellPendingAnimation(cell);
    }
});

document.getElementById("clear").addEventListener('click', event => {
    localStorage.setItem("studytime", 0);
    localStorage.setItem("hobbytime", 0);
    document.getElementById("studytimer").innerText=0;
    document.getElementById("hobbytimer").innerText=0;
});

function countUpTimer(flag, no_save){
    let date_start;
    let date = new Date();
    let count;
    let id;
    if(!flag){
        id = "studytimer";
        date_start = new Date(localStorage.getItem("study_start_date"));
        count = Number(localStorage.getItem("studyTimeSeconds"));
        if(no_save == undefined)count += Math.floor((date - date_start)/1000);
        if(localStorage.getItem("isstudy") != 0)setTimeout(()=>countUpTimer(flag), 1000);
        else localStorage.setItem("studyTimeSeconds", count);
    }
    else {
        id = "hobbytimer";
        date_start = new Date(localStorage.getItem("hobby_start_date"));
        count = Number(localStorage.getItem("hobbyTimeSeconds"));
        if(no_save == undefined)count += Math.floor((date - date_start)/1000);
        if(localStorage.getItem("ishobby") != 0)setTimeout(()=>countUpTimer(flag), 1000);
        else localStorage.setItem("hobbyTimeSeconds", count);
    }
    document.getElementById(id).innerText=Math.floor(count/3600).toString().padStart(2, "0")+":"+Math.floor((count/60)%60).toString().padStart(2, "0")+"\n"+(count%60).toString().padStart(2, "0");
}

function countHistory(events, row){
    let studytime = 0; hobbytime = 0;
    for(let i = 0; i < events.length; i++){
        if(events[i].color == 3){
            if(events[i].title.slice(0, 5) === "sssss"){
                studytime += Number(events[i].title.slice(5, 10));
            }
            if(events[i].title.slice(0, 5) === "hhhhh"){
                hobbytime += Number(events[i].title.slice(5, 10));
            }
        }
    }
    let studyhistory = createE("div", "", "", Math.floor(studytime/3600)+":"+Math.floor((studytime/60)%60).toString().padStart(2, 0)+","+(studytime%60).toString().padStart(2, 0));
    studyhistory.style.gridRow = row;
    studyhistory.style.gridColumn = 2;
    let hobbyhistory = createE("div", "", "", Math.floor(hobbytime/3600)+":"+Math.floor((hobbytime/60)%60).toString().padStart(2, 0)+","+(hobbytime%60).toString().padStart(2, 0));
    hobbyhistory.style.gridRow = row;
    hobbyhistory.style.gridColumn = 3;
    document.getElementsByClassName('grid')[0].appendChild(hobbyhistory);
    document.getElementsByClassName('grid')[0].appendChild(studyhistory);
}