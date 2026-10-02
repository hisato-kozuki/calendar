document.getElementById("p").innerText = "";
import { date_string, str2date, display, getCalendarEvents, saveCalendarEvents, countHistory, countUpTimer, searchParent, pushLocalStorage, displayTodayTomorrow } from "./function.js";
import { calendar, consoles, reload_console, register_console, timer_console } from "./class.js";

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
let eventList;
let apiUrl;
let urlLinks = {};//よく使うサイトのリンク
let studyTimeSeconds=0, hobbyTimeSeconds=0;
let isStudying=false, isHavingHobby=false;
window.applyEventUpdate = (eventData) => {
    const storedEvents = JSON.parse(localStorage.getItem("stored_events") || "[]");
    const normalizedData = {
        ...eventData,
        date_start: new Date(eventData.date_start),
        date_end: new Date(eventData.date_end),
    };
    const index = storedEvents.findIndex((item) => String(item.id) === String(normalizedData.id));
    if(index >= 0) storedEvents[index] = normalizedData;
    else storedEvents.push(normalizedData);
    localStorage.setItem("stored_events", JSON.stringify(storedEvents));
    saveCalendarEvents(storedEvents);
    // display(storedEvents, false);
    pushLocalStorage("modify", normalizedData);
};
const http_options = {
    'method' : 'post',
    'headers': {
        'Content-Type': "application/x-www-form-urlencoded",
    },
    'body' : '' //送りたいデータをpayloadに配置してJSON形式変換。
};
window.onload = function(){
    let text = date_string(todayDate, "-", {"required": ["year", "hour"]});
    register_console.datetime_inputs.set_start_datetime(text);
    register_console.datetime_inputs.set_end_datetime(text);
    document.getElementById("reload_form").start.value = date_string(new Date(todayDate-86400000), "-", {"required": ["year"]});
    document.getElementById("reload_form").end.value = date_string(date, "-", {"month_offset": 2, "required": ["year"]});
    if(!localStorage["links"])localStorage["links"] = JSON.stringify({"Youtube": "https://www.youtube.com/", "番組表": "https://www.tvkingdom.jp/chart/40.action", "やる気スイッチ": "https://hisato-kozuki.github.io/yaruki-switch/index.html", "記憶ゲーム": "https://hisato-kozuki.github.io/reversi-memory-game/index.html"});
    if(localStorage.getItem("links")){
        urlLinks = JSON.parse(localStorage.getItem("links"));
        let key = Object.keys(urlLinks);
        for(let i = 0; i < key.length; i++){
            document.getElementById("urls").innerHTML += "<p><a href='" + urlLinks[key[i]] + "'>" + key[i] + "</a></p>";
        }
    }
    localStorage.removeItem("element_modify");
    localStorage.removeItem("element_post");
    // getApiUrlFromDB().then((data)=>{apiUrl = data});
    // getCalendarEventsFromDB();
    getCalendarEvents();
    // 今日/明日の小カレンダー表示
    try{ displayTodayTomorrow(); }catch(e){console.log(e)}
    const scheduleToggle = document.getElementById("schedule_toggle");
    if(scheduleToggle){
        scheduleToggle.addEventListener("click", () => {
            document.body.classList.toggle("schedule-hidden");
            scheduleToggle.textContent = document.body.classList.contains("schedule-hidden") ? "予定を隠す" : "予定を表示";
        });
    }
    reload_console.reload(); //カレンダーを更新
    countUpTimer(true, true);countUpTimer(false, true);
    if(!(date <= new Date(localStorage["last_opened_date"]))){
        localStorage["last_opened_date"] = date;
        if(date.getHours() >= 5 && date.getHours() < 8){
            let star = document.createElement("div");
            star.innerText = "★"
            star.className = "star";
            document.body.appendChild(star);
            setTimeout(()=>{star.style.opacity = 0.5; star.style.transform = "scale(200%) translate(-25%, -25%)"}, 0)
            setTimeout(()=>{star.style.opacity = 0; star.style.transform = "scale(100%) translate(-50%, -50%)"}, 4000);
            if(date.getHours() < 6)reload_console.postEvents([{"type": "post", "data": [{"title": "★★★", date_start: date_string(date, "-", {required:["year","hour"]}), date_end: date_string(date, "-", {"required":["year","hour"]}), color: "11"}]}], {"get_required": false});
            else if(date.getHours() < 7)reload_console.postEvents([{type: "post", data: [{"title": "★★", date_start: date_string(date, "-", {required:["year","hour"]}), date_end: date_string(date, "-", {"required":["year","hour"]}), color: "11"}]}], {"get_required": false});
            else if(date.getHours() < 8)reload_console.postEvents([{type: "post", data: [{"title": "★", date_start: date_string(date, "-", {required:["year","hour"]}), date_end: date_string(date, "-", {"required":["year","hour"]}), color: "11"}]}], {"get_required": false});
        }
    }
}

document.body.addEventListener('click', (event) => {
    console.log("click", event.target.className)
    if(!event.target.closest(".event_container") && !event.target.closest(".console_container") && !event.target.closest(".button_container")){
        for(let console of consoles){
            console.shrink();
        }
    }
})
// document.getElementsByClassName("curtain")[0].addEventListener('click', (event) => {
//     for(let console of consoles){
//         console.shrink();
//         console.mode = "out";
//     }
//     // let elements = searchParent(event.target);
//     // let console_container = document.getElementsByClassName("console_container")[0];
//     // let button_container = document.getElementsByClassName("button_container")[0];
//     // // if(!elements.includes(button_container) && !elements.includes(console_container)){
//     //     let forms = document.getElementsByClassName('console_container')[0].children;
//     //     for(let i = 0; i < forms.length; i++){
//     //         forms[i].style.transform = 'scale(0, 0)';
//     //     }
//     //     document.getElementsByClassName("curtain")[0].style.opacity = 0;
//     //     document.getElementsByClassName("curtain")[0].style.visibility = "hidden";
//     //     let buttons = document.getElementsByClassName('button_container')[0].querySelectorAll("button");
//     //     for(let i = 0; i < buttons.length; i++){
//     //         buttons[i].style.backgroundColor = 'coral';
//     //     }
//     // // }
// })

reload_console.getEvents = (startDate, endDate) => {
    //res = UrlFetchApp.fetch(apiUrl,http_options); // <- Post リクエスト
    if(startDate == undefined){
        startDate = new Date(Date.parse(reload_console.start.value));
        endDate = new Date(Date.parse(reload_console.end.value));
    }
    // console.log("get_events", startDate, endDate)
    const data = {
        'type': "get",
        'date_start': startDate,
        'date_end': endDate
    };
    const apiUrl = localStorage["apiUrl"];
    if(!apiUrl){
        const message = "API URLが未設定です";
        document.getElementById("p").innerText = message;
        reload_console.sync_button.stop("Error");
        reload_console.display_button.stop("🔄");
        return Promise.reject(message);
    }
    http_options.body=JSON.stringify(data);
    reload_console.sync_button.start();
    reload_console.display_button.start();
    return new Promise((resolve, reject) => {
        fetch(apiUrl, http_options)
        .then(response => response.text())
        .then(data => {
            if(data.error){
                document.getElementById("p").innerText = data.error;
                reload_console.sync_button.stop("Error");
                reject(data.error);
            } else {
                let received_data=JSON.parse(data);
                reload_console.sync_button.stop("同期");
                resolve(received_data);
            }
        })
        .catch(error => {
            console.log("reload not complete");
            console.error("Error:", error);
            document.getElementById("p").innerText = error;
            reload_console.sync_button.stop("Error");
            reject(error);
        });
    });
}

reload_console.reload = (event, button) => {
    let promise1;
    let rangeStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - 6);
    let rangeEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if(event != undefined){
        let date_start = new Date(Date.parse(event.target.start.value));
        let date_end = new Date(Date.parse(event.target.end.value));
        date_start = rangeStart > date_start ? date_start : rangeStart;
        date_end = rangeEnd < date_end ? date_end : rangeEnd;
        promise1 = reload_console.getEvents(date_start, date_end).then((data)=>{
            display(data, true);
            console.log("更新 完了");
            saveCalendarEvents(data);
            return data;
        });
    } else promise1 = reload_console.getEvents().then((data)=>{display(data, true); console.log("更新 完了"); saveCalendarEvents(data); return data;});
    promise1.then((data) => {
        reload_console.display_button.stop("🔄");
        countHistory(data, 2, "today");
        countHistory(data, 3, "yesterday");
        countHistory(data, 4, "week");
        console.log("予定読み込み，履歴読み込み完了");
    })
}

reload_console.postEvents = (types_datas, options) => {
    console.log(types_datas);
    let promises = [];
    reload_console.display_button.start();
    for(let typedata of types_datas){
        let type = typedata.type;
        let post_data = {"type": type, "datas": typedata.data};
        const apiUrl = localStorage["apiUrl"];
        if(!apiUrl){
            const message = "API URLが未設定です";
            document.getElementById("p").innerText = message;
            reload_console.display_button.stop("🔄");
            return;
        }
        http_options.body=JSON.stringify(post_data);
        const button = reload_console.counters[type].button;
        button.start();
        promises.push(new Promise((resolve, reject) => {
            fetch(apiUrl, http_options)
            .then(response => response.text())
            .then(data => {
                if(data.slice(0,9) == "Exception"){
                    document.getElementById("p").innerText = data;
                    button.stop("Error");
                    reject(false);
                } else {
                    let parsed_data = JSON.parse(data);
                    if(options != undefined && options.cell != undefined)options.cell.textContent = "完了";
                    localStorage.removeItem("element_" + type);
                    reload_console.counters[type].counter.textContent = 0;
                    button.stop("📤");
                    resolve(true);
                    if(parsed_data.error)document.getElementById("p").innerText = parsed_data.error;
                }
            })
            .catch(error => {
                console.error("Error:", error);
                document.getElementById("p").innerText = error;
                button.stop("Error");
                reject(false);
            });
        }))
    }
    Promise.all(promises).then(() => reload_console.display_button.stop("🔄"))
    .catch(() => reload_console.display_button.stop("🔄"));
      
    return promises;
}

register_console.element.querySelectorAll("button")[2].addEventListener('click', (event) => {
    let form = event.target.parentElement;
    let button = event.target;
    event.preventDefault();
    let date_start = str2date(form.datetime_start.value, todayDate);
    let date_end = str2date(form.datetime_end.value, todayDate);
    let titleLines = (form.title.value || "").split(/\r?\n/);
    let title = titleLines[0].trim();
    let description = titleLines.slice(1).join("\n").trim();
    console.log(date_start, date_start.toLocaleString(), date_start.toDateString())
    let id = 0;
    if(button.textContent == "作成" && localStorage["element_post"])id = localStorage["element_post"].length;
    else if(button.textContent == "変更")id = form.id.value;
    const element_data = {
        'id': id,
        'title': title,
        'description': description,
        'date_start': date_start,
        'date_end': date_end,
        'color': form.color.value,
    };
    if(button.textContent == "作成"){
        calendar.addEvent(element_data, 0, 0, id);
        pushLocalStorage("post", element_data);
    } else if (button.textContent == "変更"){
        calendar.modifyEvent(element_data);
        register_console.shrink();
    }
});

register_console.datetime_inputs = {
    start: {date_text: document.getElementById("register_form").date_text_start, time_text: document.getElementById("register_form").time_text_start, datetime: document.getElementById("register_form").datetime_start}, 
    end: {date_text: document.getElementById("register_form").date_text_end, time_text: document.getElementById("register_form").time_text_end, datetime: document.getElementById("register_form").datetime_end}    
}
register_console.time_length = 0;
for(let key of ["start", "end"]){
    let inputs = register_console.datetime_inputs[key]
    register_console.datetime_inputs["set_" + key + "_datetime"] = (string) => {
        let date_time = string.replace(/-/g, "/").split(/T/g)
        inputs.date_text.value = date_time[0];
        inputs.time_text.value = date_time[1].replace(":00", "");
        inputs.datetime.value =  string
        if(key == "start"){
            register_console.datetime_inputs.set_end_datetime(date_string(new Date(Date.parse(register_console.datetime_inputs.start.datetime.value) + register_console.time_length), "-", {"required": ["year", "hour"]}));
        }
        if(key == "end"){
            register_console.time_length = Date.parse(register_console.datetime_inputs.end.datetime.value) - Date.parse(register_console.datetime_inputs.start.datetime.value);
        }
        console.log("time_length", register_console.time_length)
    }
    
    const set_datetime = register_console.datetime_inputs["set_" + key + "_datetime"];
    
    inputs.datetime.addEventListener('change', (event) => {
        console.log(event.target.value)
        set_datetime(event.target.value)
        console.log("time_length", register_console.time_length)
    })
    inputs.date_text.addEventListener('change', (event) => {
        console.log(inputs.date_text.value + "T" + inputs.time_text.value)
        set_datetime(date_string(str2date(inputs.date_text.value + "T" + inputs.time_text.value, todayDate), "-", {"required": ["year", "hour"]})) 
    })
    inputs.time_text.addEventListener('change', (event) => {
        console.log(inputs.date_text.value + "T" + inputs.time_text.value)
        set_datetime(date_string(str2date(inputs.date_text.value + "T" + inputs.time_text.value, todayDate), "-", {"required": ["year", "hour"]})) 
    })

    inputs.date_text.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Enterによるフォーム送信を防止
            inputs.time_text.focus(); // 次のinputにフォーカス
        }
    });

    register_console.datetime_inputs[key].time_text.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Enterによるフォーム送信を防止
            register_console.datetime_inputs[key == "end" ? "start" : "end"].date_text.focus(); // 次のinputにフォーカス
        }
    });
}

document.getElementById("register_form").date_text_start.addEventListener('click', (event) => {
    event.preventDefault();
})


document.getElementById("title_input").addEventListener('dragstart', event => {
    console.log("dragstart1", event.target);
    if(!window.matchMedia('(max-width:1024px) and (orientation: landscape)').matches) return;
    let form = event.target.closest("form");
    let titleLines = (form.title.value || "").split(/\r?\n/);
    let title = titleLines[0].trim();
    let description = titleLines.slice(1).join("\n").trim();
    event.dataTransfer.setData('text/plain', JSON.stringify({"title": title, "description": description, "start": form.datetime_start.value, "end": form.datetime_end.value, "color": form.color.value}));
    event.dataTransfer.effectAllowed = 'copy';
});

const calendarArea = document.getElementsByClassName('container')[0];
calendarArea.addEventListener('dragover', event => {
    if(event.dataTransfer.types.includes('text/plain'))event.preventDefault();
    console.log("dragover", event.dataTransfer);
});

// ドロップ先の日付・時刻を、座標(clientX, clientY)から解決する
// （ネイティブdropイベント／タッチによるドラッグの両方から共通で使う）
function resolveDropPoint(clientX, clientY){
    const elementAtPoint = document.elementFromPoint(clientX, clientY);
    const dropTarget = elementAtPoint && elementAtPoint.closest('.day_cell');
    if(!dropTarget) return null;
    const dateValue = dropTarget.dataset.date;
    if(!dateValue) return null;
    const timeline = dropTarget.querySelector('.timeline');
    let hour = 6;
    if(timeline){
        const rect = timeline.getBoundingClientRect();
        const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
        hour = Math.max(6, Math.min(23, 6 + Math.round((y / Math.max(rect.height, 1)) * 18)));
    }
    return { dateValue, hour };
}

// draggedData（タイトル・説明・色）を、解決済みの日付・時刻に配置する
function placeDraggedEvent(draggedData, dateValue, hour){
    const form = document.getElementById('register_form');
    if(draggedData.title != undefined || draggedData.description != undefined){
        form.title.value = `${draggedData.title || ''}${draggedData.description ? '\n' + draggedData.description : ''}`;
    }
    if(draggedData.color != undefined)form.color.value = draggedData.color;
    form.id.value = '';

    const startHour = String(hour).padStart(2, '0');
    const endHour = String(Math.min(23, hour + 1)).padStart(2, '0');
    const startDate = str2date(`${dateValue.replace(/-/g, '/')}T${startHour}:00`, todayDate);
    const endDate = str2date(`${dateValue.replace(/-/g, '/')}T${endHour}:00`, todayDate);
    if(!calendar.canPlaceEvent(dateValue, startDate, endDate)){
        document.getElementById("p").innerText = "その時間には既に予定があります";
        return;
    }
    draggedData.date_start = startDate;
    draggedData.date_end = endDate;
    draggedData.id = localStorage["element_post"] != undefined ? localStorage["element_post"].length : 0;
    calendar.addEvent(draggedData, 0, 0, localStorage["element_post"] != undefined ? localStorage["element_post"].length : 0);
    pushLocalStorage("post", draggedData);
}

calendarArea.addEventListener('drop', event => {
    event.preventDefault();
    let draggedData = {};
    try{ draggedData = JSON.parse(event.dataTransfer.getData('text/plain') || '{}'); }catch(e){}
    console.log(draggedData)
    const point = resolveDropPoint(event.clientX, event.clientY);
    if(!point) return;
    placeDraggedEvent(draggedData, point.dateValue, point.hour);
});

// スマホ横向きでのタッチドラッグ対応
// HTML5のネイティブDrag and Drop API（dragstart/dragover/drop）はタッチ操作では発火しないため、
// Pointer Eventsでドラッグ操作を代替実装する（マウス操作はネイティブDnDのまま変更しない）。
let touchDrag = null;
register_console.element.addEventListener('touchstart', event => {
    if(event.pointerType !== 'touch') return;
    if(!window.matchMedia('(max-width:1024px) and (orientation: landscape)').matches) return;
    if(event.target.closest('input, textarea, select, button, option')) return; // フォーム操作は妨げない
    const form = document.getElementById('register_form');
    const titleLines = (form.title.value || "").split(/\r?\n/);
    const title = titleLines[0].trim();
    if(!title) return; // タイトル未入力ならドラッグ配置しない
    const description = titleLines.slice(1).join("\n").trim();

    event.preventDefault();
    const ghost = document.createElement('div');
    ghost.textContent = title;
    ghost.style.cssText = 'position:fixed;z-index:999;pointer-events:none;left:0;top:0;padding:0.4em 0.8em;border-radius:0.5em;background:var(--main,#4A90E2);color:white;font-size:0.9em;box-shadow:0 4px 10px rgba(0,0,0,0.3);transform:translate(-50%,-50%);white-space:nowrap;';
    ghost.style.left = event.touches[0].clientX + 'px';
    ghost.style.top = event.touches[0].clientY + 'px';
    document.body.appendChild(ghost);
    touchDrag = { pointerId: event.pointerId, ghost, data: { title, description, color: form.color.value } };
});
document.addEventListener('touchmove', event => {
    console.log("pointermove")
    if(!touchDrag || event.pointerId !== touchDrag.pointerId) return;
    touchDrag.ghost.style.left = event.changedTouches[0].clientX + 'px';
    touchDrag.ghost.style.top = event.changedTouches[0].clientY + 'px';
});
document.addEventListener('touchend', event => {
    console.log("pointerup")
    if(!touchDrag || event.pointerId !== touchDrag.pointerId) return;
    const { data, ghost } = touchDrag;
    touchDrag = null;
    ghost.remove();
    const point = resolveDropPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    if(point) placeDraggedEvent(data, point.dateValue, point.hour);
});
document.addEventListener('pointercancel', event => {
    if(!touchDrag || event.pointerId !== touchDrag.pointerId) return;
    touchDrag.ghost.remove();
    touchDrag = null;
});

document.getElementById("apiurl_form").addEventListener('submit', event => {
    // イベントを停止する
    event.preventDefault();
    apiUrl=event.target.url.value;
    localStorage["apiUrl"] = apiUrl;
    // saveApiUrlToDB(apiUrl);
    reload_console.getEvents().then((data)=>{
        display(data, true); //saveCalendarEventsToDB(data);
        reload_console.display_button.stop("🔄");
        saveCalendarEvents(data);
        console.log("url更新 完了")
    });
});

reload_console.element.querySelector("form").addEventListener('submit', event => {
    event.preventDefault();
    let button = event.target.querySelector("#getbutton");
    if(button.textContent == "同期"){
        let promises = [];
        let types_datas = [];
        for(let type of ["post", "delete", "modify"]){
            let stored_data = localStorage["element_"+type];
            if(stored_data){
                types_datas.push({type: type, data: JSON.parse(stored_data)});
            }
        }
        let promise = reload_console.postEvents(types_datas, {"get_required": false});
        Promise.all(promise)
        .then((results) => {
            console.log(promise)
            reload_console.reload(event);
        })
    } else button.textContent = "同期";
});

document.getElementById("clear").addEventListener('click', event => {
    // イベントを停止する
    event.preventDefault();
    
    let form = document.getElementById("register_form");
    form.title.value = "";
    form.date_text_start.placeholder = form.date_text_start.value || form.date_text_start.placeholder;
    form.time_text_start.placeholder = form.time_text_start.value || form.time_text_start.placeholder;
    form.date_text_end.placeholder = form.date_text_end.value || form.date_text_end.placeholder;
    form.time_text_end.placeholder = form.time_text_end.value || form.time_text_end.placeholder;
    form.date_text_start.value = "";
    form.time_text_start.value = "";
    form.date_text_end.value = "";
    form.time_text_end.value = "";
    form.color.value = 8;
    document.getElementById("colorcircle").style.backgroundColor = "#616161";
});

document.getElementById("copy_date").addEventListener('click', event => {
    // イベントを停止する
    event.preventDefault();
    register_console.datetime_inputs.set_end_datetime(register_console.datetime_inputs.start.datetime.value);
});

document.getElementById("urlform").addEventListener('submit', event => {
    // イベントを停止する
    event.preventDefault();
    let urlformbutton = document.getElementById("urlformbutton");
    if(urlformbutton.innerText == "登録" && event.target.name.value != "" && event.target.url.value != ""){
        urlLinks[event.target.name.value] = event.target.url.value;
        localStorage.setItem("links", JSON.stringify(urlLinks));
        urlformbutton.innerText="完了";
        document.getElementById("urls").innerHTML = "";
        let key = Object.keys(urlLinks);
        for(let i = 0; i < key.length; i++){
            document.getElementById("urls").innerHTML += "<p style='font-size:20px'><a href='" + urlLinks[key[i]] + "'>" + key[i] + "</a></p>";
        }
    }else urlformbutton.innerText="登録";
});

document.getElementById("timer_select").addEventListener('click', event =>{
    let cell = event.target;
    localStorage.setItem("isstudy", 0);
    localStorage.setItem("ishobby", 0);
    let count;
    if(cell.textContent == "勉強"){
        cell.textContent = "趣味";
        count = Number(localStorage.getItem("hobbyTimeSeconds"));
    } else {
        cell.textContent = "勉強";
        count = Number(localStorage.getItem("studyTimeSeconds"));
    }
    document.getElementById("timer").innerText=Math.floor(count/3600).toString().padStart(2, "0")+":"+Math.floor((count/60)%60).toString().padStart(2, "0")+" "+(count%60).toString().padStart(2, "0");
})
document.getElementById("studybutton").addEventListener('click', event => {
    if(document.getElementById("timer_select").textContent == "勉強"){
        if(localStorage.getItem("isstudy") != 1){
            localStorage.setItem("isstudy", 1);
            localStorage.setItem("study_start_date", new Date());
            countUpTimer(false);
        }
        else{
            localStorage.setItem("isstudy", 0);
        }
    } else if(document.getElementById("timer_select").textContent == "趣味"){
        if(localStorage.getItem("ishobby") != 1){
            localStorage.setItem("ishobby", 1);
            localStorage.setItem("hobby_start_date", new Date());
            countUpTimer(true);
        }
        else{
            localStorage.setItem("ishobby", 0);
        }
    }
});

document.getElementById("studysend").addEventListener('click', event => {
    let cell = event.target;
    let select = document.getElementById("timer_select").textContent;
    if(cell.innerText == "完了")cell.innerText = "📤";
    else{
        let data = [{
            'date_start': todayDate,
            'date_end': todayDate,
            'color': 3,
        }];
        if(select == "勉強"){
            data[0].title = "sssss"+(localStorage.getItem("studyTimeSeconds")).toString().padStart(5, "0");
            localStorage.setItem("studyTimeSeconds", 0);
        } else if(select == "趣味"){
            data[0].title = "hhhhh"+(localStorage.getItem("hobbyTimeSeconds")).toString().padStart(5, "0");
            localStorage.setItem("hobbyTimeSeconds", 0);
        }
        timer_console.send_button.start();
        Promise.all(reload_console.postEvents([{type: "post", data: data}], {"get_required": false})).then((data) => {
            timer_console.send_button.stop("📤");
            document.getElementById("timer").innerText = "00:00 00";
        }).catch((data) => {
            timer_console.send_button.stop("Error");
        });
    }
});

document.getElementById("clear_timer").addEventListener('click', event => {
    localStorage.setItem("studyTimeSeconds", 0);
    localStorage.setItem("hobbyTimeSeconds", 0);
    document.getElementById("timer").innerText = "00:00 00";
});

reload_console.display_button.element.addEventListener("dblclick", event =>{
    event.preventDefault();
    reload_console.sync_button.element.click();
})

register_console.display_button.element.addEventListener("click", event =>{
    register_console.element.querySelectorAll("button")[2].textContent = "作成";
})