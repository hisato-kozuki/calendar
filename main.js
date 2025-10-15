document.getElementById("p").innerText = "";
import { date_string, get_events, postEvents, cellPendingAnimation, reload, display, getCalendarEvents, saveCalendarEvents, countUpTimer, button_display, searchParent, pushLocalStorage } from "./functions.js";
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
            document.getElementById("urls").innerHTML += "<p style='font-size:16px'><a href='" + urlLinks[key[i]] + "'>" + key[i] + "</a></p>";
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

document.getElementById("register_form").addEventListener('submit', (event) => {
    // イベントを停止する
    let form = event.target;
    let button = document.getElementById("postbutton");
    event.preventDefault();
    let date_start = new Date(Date.parse(form.start.value));
    let date_end = new Date(Date.parse(form.end.value));
    console.log(date_start, date_start.toLocaleString(), date_start.toDateString())
    const element_data = {
        'title': form.title.value,
        'date_start': date_start,
        'date_end': date_end,
        'color': form.color.value,
    };
    pushLocalStorage("element_post", element_data);
    if(element_data.title != "" && button.innerText == "送信"){
        cellPendingAnimation(button);
        postEvents("post", [element_data], {"get_required": true}).then((data) => {
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

document.getElementById("reload_form").addEventListener('submit', event => {
    event.preventDefault();
    let button = event.target.querySelector("#getbutton");
    if(button.textContent == "更新"){
        let promises = [];
        if(localStorage["element_post"])promises.push(postEvents("post", JSON.parse(localStorage["element_post"]), {"get_requiredfalse": false}));
        if(localStorage["element_delete"])promises.push(postEvents("delete", JSON.parse(localStorage["element_delete"])));
        let element_datas = [];
        if(localStorage["element_modify"]){
            element_datas = JSON.parse(localStorage["element_modify"]);
            for(let element_data of element_datas){
                console.log(element_data)
                if(element_data.date){
                    // 日付の区切り：-, /　時間の区切り：:　日付と時間の区切り：/,  , T
                    let new_date = element_data.date.split(/~|～|\n/, 2); // 開始と終了で分割
                    if(new_date[1] == undefined)new_date[1] = new_date[0]; // 終了が無い場合は開始と同じとみなす
                    for(let i = 0; i < 2; i++){
                        let buffer = new_date[i].split(/年|月/).map((p) => p.padStart(2, '0')).join("-"); // 日付部分をYYYY-MM-DD形式に変換
                        buffer = buffer.split(/時|分/).map((p) => p.padStart(2, '0')).join(":"); // 時間部分をhh:mm形式に変換
                        if(!buffer.match(/\d{4}/)){ // 年が無い場合は今年とみなす
                            if(!buffer.match(/\d{2}[/-月]\d{2}/)){ // 月日が無い場合は今日とみなす
                                buffer = (todayDate.getMonth()+1)+ "/" + todayDate.getDate()+ " " + buffer;
                            }
                            buffer = todayDate.getFullYear()+ "/" + buffer;
                        }
                        new_date[i] = buffer.split(/T|\.|日/).join(" "); // 日付と時間で分割
                    }
                    console.log(new_date)
                    element_data.date_start = new_date[0];
                    element_data.date_end = new_date[1];
                }
            }

            promises.push(postEvents("modify", element_datas));
        }
        Promise.all(promises)
        .then((results) => {
            console.log(promises)
            reload(event, button);
        })
    } else button.textContent = "更新";
});

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
        let data = [{
            'title': "sssss"+(localStorage.getItem("studyTimeSeconds")).toString().padStart(5, "0"),
            'date_start': todayDate,
            'date_end': todayDate,
            'color': 3,
        }];
        localStorage.setItem("studyTimeSeconds", 0);
        postEvents("post", data, {"get_required": false}).then((data) => {
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
        let data = [{
            'title': "hhhhh"+(localStorage.getItem("hobbyTimeSeconds")).toString().padStart(5, "0"),
            'date_start': todayDate,
            'date_end': todayDate,
            'color': 3,
        }];
        localStorage.setItem("hobbyTimeSeconds", 0);
        postEvents("post", data, {"get_required": false}).then((data) => {
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
    button_display(event.target, 'register_console');
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