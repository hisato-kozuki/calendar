import { date_string, get_events, post_event, getCalendarEventsFromDB, saveCalendarEventsToDB, getApiUrlFromDB, saveApiUrlToDB } from "./functions.js";
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
    document.getElementById("form").start.value = text;
    document.getElementById("form").end.value = text;
    document.getElementById("form3").start.value = date_string(date, "-", {"required": ["year"]});
    document.getElementById("form3").end.value = date_string(date, "-", {"month_offset": 2, "required": ["year"]});
    apiUrl = getApiUrlFromDB();
    getCalendarEventsFromDB(apiUrl);
    if(localStorage.getItem("links")){
        urlLinks = JSON.parse(localStorage.getItem("links"));
        let key = Object.keys(urlLinks);
        for(let i = 0; i < key.length; i++){
            document.getElementById("urls").innerHTML += "<p style='font-size:20px'><a href='" + urlLinks[key[i]] + "'>" + key[i] + "</a></p>";
        }
    }
    countUpTimer(true, true);countUpTimer(false, true);
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
    get_events().then((data)=>{display(apiUrl, data, true);saveCalendarEventsToDB(data);
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
        get_events(date_start, date_end).then((data)=>{display(apiUrl, data, true);saveCalendarEventsToDB(data);
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

document.getElementById("historybutton").addEventListener('click', event => {
    let history = document.getElementsByClassName('grid')[0];
    if(history.style.display != 'grid'){
        history.style.display = 'grid';
    }else{
        history.style.display = 'none';
    }
});