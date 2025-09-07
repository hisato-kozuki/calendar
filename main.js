import { date_string, get_events, post_event, cellPendingAnimation, reload, display, getCalendarEvents, saveCalendarEvents, getCalendarEventsFromDB, saveCalendarEventsToDB, getApiUrlFromDB, saveApiUrlToDB, countUpTimer, button_display } from "./functions.js";
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

window.onload = function(){
    let text = date_string(todayDate, "-", {"required": ["year", "hour"]});
    document.getElementById("register_form").start.value = text;
    document.getElementById("register_form").end.value = text;
    document.getElementById("reload_form").start.value = date_string(date, "-", {"required": ["year"]});
    document.getElementById("reload_form").end.value = date_string(date, "-", {"month_offset": 2, "required": ["year"]});
    // getApiUrlFromDB().then((data)=>{apiUrl = data});
    // getCalendarEventsFromDB();
    getCalendarEvents();
    reload(); //カレンダーを更新
    if(localStorage.getItem("links")){
        urlLinks = JSON.parse(localStorage.getItem("links"));
        let key = Object.keys(urlLinks);
        for(let i = 0; i < key.length; i++){
            document.getElementById("urls").innerHTML += "<p style='font-size:20px'><a href='" + urlLinks[key[i]] + "'>" + key[i] + "</a></p>";
        }
    }
    countUpTimer(true, true);countUpTimer(false, true);
}

document.getElementById("register_form").addEventListener('submit', (event) => {
    // イベントを停止する
    let form = event.target;
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
    } else {button.innerText = "送信";}
});

document.getElementById("apiurl_form").addEventListener('submit', event => {
    // イベントを停止する
    event.preventDefault();
    apiUrl=event.target.url.value;
    event.target.style.visibility="hidden";
    localStorage["apiUrl"] = apiUrl;
    // saveApiUrlToDB(apiUrl);
    get_events().then((data)=>{
        display(data, true); //saveCalendarEventsToDB(data);
        saveCalendarEvents(data);
        console.log("url更新 完了")
        document.getElementById("getbutton").innerText = "更新";
    });
});

document.getElementById("reload_form").addEventListener('submit', event => {reload(event)});

document.getElementById("date_default").addEventListener('click', event => {
    // イベントを停止する
    event.preventDefault();
    
    let text = document.getElementById("register_form").start.value;
    console.log(text);
    document.getElementById("register_form").end.value = text;
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
    let cell = event.target;
    if(cell.innerText == "完了")cell.innerText = "送信";
    else{
        let data = {
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
    let cell = event.target;
    if(cell.innerText == "完了")cell.innerText = "送信";
    else{
        let data = {
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
    localStorage.setItem("studyTimeSeconds", 0);
    localStorage.setItem("hobbyTimeSeconds", 0);
    document.getElementById("studytimer").innerText=0;
    document.getElementById("hobbytimer").innerText=0;
});

document.getElementById("register_display_button").addEventListener("click", event =>{
    button_display('register_form');
})
document.getElementById("get_display_button").addEventListener("click", event =>{
    button_display('reload_form');
})
document.getElementById("url_display_button").addEventListener("click", event =>{
    button_display('urlform');
})
document.getElementById("timer_display_button").addEventListener("click", event =>{
    button_display('timerform');
})
document.getElementById("historybutton").addEventListener("click", event =>{
    button_display('historyform');
})
document.getElementById("urlbutton").addEventListener("click", event =>{
    button_display('apiurl_form');
})