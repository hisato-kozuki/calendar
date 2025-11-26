document.getElementById("p").innerText = "";
import { date_string, str2date, get_events, postEvents, reload, display, getCalendarEvents, saveCalendarEvents, countUpTimer, button_display, searchParent, pushLocalStorage } from "./function.js";
import { calendar, buttons } from "./class.js";

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
    document.getElementById("register_form").datetime_start.value = text;
    document.getElementById("register_form").datetime_end.value = text;
    document.getElementById("reload_form").start.value = date_string(new Date(todayDate-86400000), "-", {"required": ["year"]});
    document.getElementById("reload_form").end.value = date_string(date, "-", {"month_offset": 2, "required": ["year"]});
    // getApiUrlFromDB().then((data)=>{apiUrl = data});
    // getCalendarEventsFromDB();
    getCalendarEvents();
    reload(); //カレンダーを更新
    if(localStorage.getItem("links")){
        urlLinks = JSON.parse(localStorage.getItem("links"));
        let key = Object.keys(urlLinks);
        for(let i = 0; i < key.length; i++){
            document.getElementById("urls").innerHTML += "<p><a href='" + urlLinks[key[i]] + "'>" + key[i] + "</a></p>";
        }
    }
    localStorage.removeItem("element_modify");
    localStorage.removeItem("element_post");
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
        let buttons = document.getElementsByClassName('button_container')[0].children;
        for(let i = 0; i < buttons.length; i++){
            buttons[i].style.backgroundColor = 'coral';
        }
    // }
})

document.getElementById("postbutton").addEventListener('click', (event) => {
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
        document.getElementById("register_console").style.transform = 'scale(0, 0)';
        document.getElementsByClassName("curtain")[0].style.opacity = 0;
        document.getElementsByClassName("curtain")[0].style.visibility = "hidden";
        document.getElementById("register_display_button").style.backgroundColor = "coral";
    }
    // if(element_data.title != "" && button.innerText == "送信"){
    //     cellPendingAnimation(button);
    //     postEvents("post", [element_data], {"get_required": true}).then((data) => {
    //         if(data)document.getElementById("postbutton").innerText = "完了";
    //         else document.getElementById("postbutton").innerText = "Error";
    //     });
    // } else {button.innerText = "送信";}
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
    buttons["sync"].start();
    get_events().then((data)=>{
        display(data, true); //saveCalendarEventsToDB(data);
        saveCalendarEvents(data);
        console.log("url更新 完了")
        buttons["sync"].stop("同期");
    });
});

document.getElementById("reload_form").addEventListener('submit', event => {
    event.preventDefault();
    let button = event.target.querySelector("#getbutton");
    if(button.textContent == "同期"){
        let promises = [];
        for(let type of ["post", "delete", "modify"]){
            if(localStorage["element_"+type]){
                buttons[type].start();
                let promise = postEvents(type, JSON.parse(localStorage["element_"+type]), {"get_required": false});
                promise.then(()=>buttons[type].stop("📤")).catch(()=>buttons[type].stop("Error"));
                promises.push(promise);
            }
        }
        Promise.all(promises)
        .then((results) => {
            console.log(promises)
            reload(event);
        });
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
        buttons["timersend"].start();
        postEvents("post", data, {"get_required": false}).then((data) => {
            if(data){
                buttons["timersend"].stop("📤");
                document.getElementById("timer").innerText = "00:00 00";
            }
            else buttons["timersend"].stop("Error");
        });
    }
});

document.getElementById("clear_timer").addEventListener('click', event => {
    localStorage.setItem("studyTimeSeconds", 0);
    localStorage.setItem("hobbyTimeSeconds", 0);
    document.getElementById("timer").innerText = "00:00 00";
});

document.getElementById("register_display_button").addEventListener("click", event =>{
    button_display(event.target, 'register_console');
    document.getElementById("postbutton").textContent = "作成";
})
document.getElementById("get_display_button").addEventListener("click", event =>{
    button_display(event.target, 'reload_console');
})
document.getElementById("url_display_button").addEventListener("click", event =>{
    button_display(event.target, 'url_console');
})
document.getElementById("timer_display_button").addEventListener("click", event =>{
    button_display(event.target, 'timer_console');
})
document.getElementById("historybutton").addEventListener("click", event =>{
    button_display(event.target, 'history_console');
})
document.getElementById("urlbutton").addEventListener("click", event =>{
    button_display(event.target, 'apiurl_console');
})