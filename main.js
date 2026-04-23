document.getElementById("p").innerText = "";
import { date_string, str2date, display, getCalendarEvents, saveCalendarEvents, countHistory, countUpTimer, searchParent, pushLocalStorage, displayTodayTomorrow } from "./function.js";
import { calendar, reload_console, register_console, timer_console } from "./class.js";

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
const http_options = {
    'method' : 'post',
    'headers': {
        'Content-Type': "application/x-www-form-urlencoded",
    },
    'body' : '' //送りたいデータをpayloadに配置してJSON形式変換。
};
window.onload = function(){
    let text = date_string(todayDate, "-", {"required": ["year", "hour"]});
    document.getElementById("register_form").datetime_start.value = text;
    document.getElementById("register_form").datetime_end.value = text;
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
    reload_console.reload(); //カレンダーを更新
    countUpTimer(true, true);countUpTimer(false, true);
}

document.getElementsByClassName("curtain")[0].addEventListener('click', (event) => {
    let elements = searchParent(event.target);
    let console_container = document.getElementsByClassName("console_container")[0];
    let button_container = document.getElementsByClassName("button_container")[0];
    // if(!elements.includes(button_container) && !elements.includes(console_container)){
        let forms = document.getElementsByClassName('console_container')[0].children;
        for(let i = 0; i < forms.length; i++){
            forms[i].style.transform = 'scale(0, 0)';
        }
        document.getElementsByClassName("curtain")[0].style.opacity = 0;
        document.getElementsByClassName("curtain")[0].style.visibility = "hidden";
        let buttons = document.getElementsByClassName('button_container')[0].querySelectorAll("button");
        for(let i = 0; i < buttons.length; i++){
            buttons[i].style.backgroundColor = 'coral';
        }
    // }
})

reload_console.getEvents = (startDate, endDate) => {
    //res = UrlFetchApp.fetch(apiUrl,http_options); // <- Post リクエスト
    if(startDate == undefined){
        startDate = new Date(todayDate);
        endDate =  new Date(todayDate);
        startDate.setDate(startDate.getDate()-1);
        endDate.setMonth(endDate.getMonth()+2);
    }
    // console.log("get_events", startDate, endDate)
    const data = {
        'type': "get",
        'date_start': startDate,
        'date_end': endDate
    };
    http_options.body=JSON.stringify(data);
    reload_console.sync_button.start();
    reload_console.display_button.start();
    return new Promise((resolve, reject) => {
        fetch(localStorage["apiUrl"], http_options)
        .then(response => response.text())
        .then(data => {
            let received_data=JSON.parse(data);
            if(data.error)document.getElementById("p").innerText = data.error;
            reload_console.sync_button.stop("同期");
            resolve(received_data);
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
    if(event != undefined){ //ボタンを押して更新する場合
        let date_start = new Date(Date.parse(event.target.start.value));
        let date_end = new Date(Date.parse(event.target.end.value));
        promise1 = reload_console.getEvents(date_start, date_end).then((data)=>{
            display(data, true);//saveCalendarEventsToDB(data);
            console.log("更新 完了");
            saveCalendarEvents(data);
        });
    } else promise1 = reload_console.getEvents().then((data)=>{display(data, true); console.log("更新 完了"); saveCalendarEvents(data);}); //最初に更新する場合
    const promise2 = new Promise((resolve) =>reload_console.getEvents(todayDate, date, false).then((data)=>resolve(data)));
    let date_old = new Date(todayDate - 86400000);
    const promise3 = new Promise((resolve) =>reload_console.getEvents(date_old, todayDate, false).then((data)=>resolve(data)));
    date_old = new Date(todayDate - 604800000);
    const promise4 = new Promise((resolve) =>reload_console.getEvents(date_old, todayDate, false).then((data)=>resolve(data)));
    Promise.all([promise1, promise2, promise3, promise4])
    .then((results) => {
        console.log("d")
        reload_console.display_button.stop("🔄");
        countHistory(results[1], 2);
        countHistory(results[2], 3);
        countHistory(results[3], 4);
        console.log("ボタン更新2")
        console.log("予定読み込み，履歴読み込み完了");
    })
}

reload_console.postEvents = (types_datas, options) => {
    console.log(types_datas);
    let received_data;
    let promises = [];
    reload_console.display_button.start();
    for(let typedata of types_datas){
        let type = typedata.type;
        let post_data = {"type": type, "datas": typedata.data};
        http_options.body=JSON.stringify(post_data);
        const button = reload_console.counters[type].button;
        button.start();
        promises.push(new Promise((resolve, reject) => {
            fetch(localStorage["apiUrl"], http_options)
            .then(response => response.text())
            .then(data => {
                console.log(received_data = data);
                let parsed_data = JSON.parse(data);
                if(options != undefined && options.cell != undefined)options.cell.textContent = "完了";
                localStorage.removeItem("element_" + type);
                reload_console.counters[type].counter.textContent = 0;
                button.stop("📤");
                resolve(true);
                if(parsed_data.error)document.getElementById("p").innerText = parsed_data.error;
            })
            .catch(error => {
                console.error("Error:", error);
                document.getElementById("p").innerText = error + "\n" + received_data;
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
    // イベントを停止する
    let form = event.target.parentElement;
    let button = event.target;
    event.preventDefault();
    let date_start = str2date(form.start.value, todayDate);
    let date_end = str2date(form.end.value, todayDate);
    console.log(date_start, date_start.toLocaleString(), date_start.toDateString())
    let id = 0;
    if(button.textContent == "作成" && localStorage["element_post"])id = localStorage["element_post"].length;
    else if(button.textContent == "変更")id = form.id.value;
    const element_data = {
        'id': id,
        'title': form.title.value,
        'date_start': date_start,
        'date_end': date_end,
        'color': form.color.value,
    };
    if(button.textContent == "作成"){
        calendar.addEvent(element_data, 0, 0, id);
        pushLocalStorage("post", element_data);
    } else if (button.textContent == "変更"){
        calendar.modifyEvent(element_data);
        pushLocalStorage("modify", element_data);
        register_console.shrink();
    }
});

document.getElementById("register_form").datetime_start.addEventListener('change', (event) => {
    document.getElementById("register_form").start.value = event.target.value.replace(/-/g, "/").replace(/T/g, " ")
})
document.getElementById("register_form").datetime_end.addEventListener('change', (event) => {
    document.getElementById("register_form").end.value = event.target.value.replace(/-/g, "/").replace(/T/g, " ")
})
document.getElementById("register_form").start.addEventListener('change', (event) => {
    document.getElementById("register_form").datetime_start.value = date_string(str2date(event.target.value, todayDate), "-", {"required": ["year", "hour"]})
})
document.getElementById("register_form").end.addEventListener('change', (event) => {
    document.getElementById("register_form").datetime_end.value = date_string(str2date(event.target.value, todayDate), "-", {"required": ["year", "hour"]})
})
document.getElementById("register_form").start.addEventListener('click', (event) => {
    event.preventDefault();
})

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
    form.start.value = "";
    form.end.value = "";
    form.color.value = 8;
    document.getElementById("colorcircle").style.backgroundColor = "#616161";
});

document.getElementById("date_default").addEventListener('click', event => {
    // イベントを停止する
    event.preventDefault();
    
    let text_date = document.getElementById("register_form").datetime_start.value;
    document.getElementById("register_form").datetime_end.value = text_date;
    text_date = text_date.replace(/-/g, "/").replace(/T/, " ");
    document.getElementById("register_form").start.value = text_date;
    document.getElementById("register_form").end.value = text_date;
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
    reload_console.sync_button.element.click();
})

register_console.display_button.element.addEventListener("click", event =>{
    register_console.element.querySelectorAll("button")[2].textContent = "作成";
})