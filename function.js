import { reload_console } from "./class.js";
import { getStorage, getGasEventList } from "./storage.js";

const date = new Date();
const todayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
const hobbies = ["activity-game", "activity-tv", "activity-video", "activity-sns", "activity-book", "activity-other"];

export function date_string(date, separator, options){
    let date_buffer = new Date(date);
    let date_string = "";
    if(options.month_offset != undefined)date_buffer.setMonth(date.getMonth() + options.month_offset);
    if(options.required.includes("year"))date_string += date_buffer.getFullYear().toString();
    date_string += separator + (date_buffer.getMonth() + 1).toString().padStart(2, "0")
    date_string += separator + date_buffer.getDate().toString().padStart(2, "0")
    if(options.required.includes("hour") && separator == "-")date_string += "T" + date_buffer.getHours().toString().padStart(2, "0") + ":" + date_buffer.getMinutes().toString().padStart(2, "0");;
    if(options.required.includes("hour") && separator == "/")date_string += " " + date_buffer.getHours().toString() + ":" + date_buffer.getMinutes().toString().padStart(2, "0");
    return date_string;
}

export function str2date(date_string, defaultDate){
    /*
        Date()で日付と認識されるパターンは以下の三つ．
        スペースとスラッシュはいくら重ねてもいい．ハイフンとTは単体で使う．
        yyyy[[ /]+-]mm[[ /]+-]+dd[ /]+hh:mm　dateの区切りは( ,/,-)，日と時の区切りは( ,/)，timeの区切りは:のみ
        yyyy[[ /]+]mm[[ /]+]+dd-hh:mm　dateの区切りは( ,/)，日と時の区切りは(-)，timeの区切りは:のみ
        yyyy-mm-ddThh:mm　date，日と時，timeの区切りは-，T，:
    */
    let buffer = date_string.split(/[T]/);
    console.log("first", buffer)
    // if(!buffer[0].match(/[-/年月]/))buffer = ["", buffer[0]];
    // else if(!buffer[1])buffer = [buffer[0], ""];

    buffer[0] = buffer[0].split(/[ /年月]/).map((p) => p = p.padStart(2, '0')).join("-"); // 日付部分をYYYY-MM-DD形式に変換
    console.log("buffer", buffer)
    if(!buffer[0].match(/^\d{4}/)){ // 年が無い場合は今年とみなす
        console.log(buffer[0], buffer[0].match(/^\d{2}\-\d{2}/))
        if(!buffer[0].match(/^\d{2}\-\d{2}/)){ // 月日が無い場合は今日とみなす
            buffer[0] = String(defaultDate.getMonth()+1).padStart(2, '0')+ "-" + String(defaultDate.getDate()).padStart(2, '0');
        } else if(buffer[0].match(/^00/)){ // 日があり月だけが無い場合は今月とみなす
            buffer[0] = buffer[0].replace(/00/, String(defaultDate.getMonth()+1).padStart(2, '0'));
        }
        buffer[0] = defaultDate.getFullYear()+ "-" + buffer[0];
    }
    buffer[1] = buffer[1].split(/[ :時分]/).map((p) => p = p.padStart(2, '0')).join(":"); // 時間部分をhh:mm形式に変換
    console.log(buffer[1])
    if(!buffer[1].match(/^\d{2}:\d{2}/)){ // 時、分が無い場合
        if(buffer[1].match(/^\d{2}/)){ // 分が有る場合は:00を付け足す
            buffer[1] += ":00";
        } else buffer[1] = "00:00";
    }
    
    return new Date(buffer.join(" ")); // 日付と時間で分割
}

export function createE(tag, options, styles){
    let element = document.createElement(tag);
    for(let key in options){
        element[key] = options[key];
    }
    for(let key in styles){
        element.style[key] = styles[key];
    }
    return element;
}

export function renewTask(event_data, date, color){
    console.log("detected");
    let new_date = new Date(date);
    let date_end = new Date(event_data.date_end);
    new_date.setFullYear(todayDate.getFullYear());new_date.setMonth(todayDate.getMonth());
    if(color == 11)new_date.setDate(todayDate.getDate());
    else if(color == 4)new_date.setDate(todayDate.getDate()+1);
    else if(color == 1)new_date.setDate(date.getDate()+7);
    else if(color == 9)new_date.setMonth(date.getMonth()+1);
    if(date_end < new_date){
        color = 11;
        date_end.setFullYear(new_date.getFullYear());
        date_end.setMonth(new_date.getMonth());
        date_end.setDate(new_date.getDate());
    }
    let datas = {
        'id': event_data.id,
        'title': event_data.title,
        'date_start': new_date,
        'date_end': date_end,
        'color': color,
    };
    console.log(datas)
    if(datas.title != ""){
        pushLocalStorage("modify", datas);
    }
}

export function countHistory(events, row, period){
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - 6);
    console.log(today, yesterday, weekStart)
    let studytime = 0; let hobbytime = 0;
    for(let i = 0; i < events.length; i++){
        // console.log(events[i].title)
        const eventDate = new Date(events[i].date_start);
        const inRange = period === "today"
            ? eventDate >= today && eventDate < new Date(today.getTime() + 86400000)
            : period === "yesterday"
                ? eventDate >= yesterday && eventDate < today
                : eventDate >= weekStart && eventDate <= today;
        if(inRange){
            // console.log(events[i].title)
            if(events[i].title.slice(0, 5) === "sssss"){
                studytime += Number(events[i].title.slice(5, 10));
            }else if(events[i].title.slice(0, 5) === "hhhhh"){
                hobbytime += Number(events[i].title.slice(5, 10));
                // console.log(period, "hobbytime hhhhh", (events[i].title.slice(5, 10)));
            }else if(hobbies.includes(events[i].title.split(":")[0])){
                hobbytime += Number(events[i].title.split(":")[1]);
                // console.log(period, "hobbytime", (events[i].title.split(":")[1]));
            }
        }
    }
    let studyhistory = document.getElementById("history"+row+"2");
    studyhistory.innerText = Math.floor(studytime/3600)+":"+Math.floor((studytime/60)%60).toString().padStart(2, 0)+","+(studytime%60).toString().padStart(2, 0);
    let hobbyhistory = document.getElementById("history"+row+"3");
    hobbyhistory.innerText = Math.floor(hobbytime/3600)+":"+Math.floor((hobbytime/60)%60).toString().padStart(2, 0)+","+(hobbytime%60).toString().padStart(2, 0);
}

function createEventBackground(options, indexElement){
    let event_back = createE("div", {"className": "landscape_only"}, {
        "backgroundColor": "hsla("+options.i*159+", 100%, 50%, 0.05)", "border": "solid 0.1px hsla("+options.i*159+", 100%, 0%, 0.2)", 
        "gridRow": options.startHour+"/"+options.endHour, "gridColumn": options.start_column+"/"+options.start_column + 1,
        "position": "relative", "top": (3*(options.start_column-1))+"px"
    });
    if(options.wide){
        event_back.style.gridColumn = "1/2";
        event_back.style.borderLeft = "transparent";
        event_back.style.borderRight = "transparent";
    }
    options.timelines[Math.max(options.number, 0)].insertBefore(event_back, options.timelines[Math.max(options.number, 0)].children[1]);
}

export function display(events, task_renew_required){
    const calendar = getStorage().calendar;
    if(!events || events.length === 0){
        calendar.remove();
        return;
    }
    let date_start = new Date(events[0].date_start);
    let date_end = new Date(events[events.length - 1].date_end);
    let date_start_sunday = new Date(date_start.getFullYear(), date_start.getMonth(), date_start.getDate()-date_start.getDay()%7);
    let date_end_saturday = new Date(date_end.getFullYear(), date_end.getMonth(), date_end.getDate()+(6-date_end.getDay())%7);
    
    let calendar_data = {
        events: [], // イベントの配列
    }
    for(let event of events){
        let category = "plan";
        if(event.title.slice(0, 4) === "task")category = "task";
        else if(event.title.slice(0, 5) === "sssss")category = "study";
        else if(event.title.slice(0, 5) === "hhhhh")category = "hobby";
        else if(hobbies.includes(event.title.split(":")[0]))category = "hobby";
        calendar_data.events.push({
            category: category,
            event_data_gas: event
        });
    }
    calendar.update(calendar_data);
    calendar.view_date_start = new Date(date_start_sunday);
    calendar.view_date_end = new Date(date_end_saturday);
    calendar.view();
    console.log("display start");
    // let skip = 0;
    // let duplicate_same_hour = 0;
    // let duplicate_over_day = 0;
    // let oldStartDate = new Date(date_start);
    // let oldStartHour = Math.min(Math.max(oldStartDate.getHours()-5, 1), 20);
    // let date_end_long = new Array(5);
    // for(let i = 0; i < events.length; i++){
    //     const is_bobby_time = hobbies.includes(events[i].title.split(":")[0]);
    //     if(events[i].title.slice(0, 5) !== "hhhhh" && events[i].title.slice(0, 5) !== "sssss" && !is_bobby_time){
    //         // console.log(events[i].date_start)
    //         let eventStartDate = new Date(events[i].date_start);
    //         let startHour = Math.min(Math.max(eventStartDate.getHours()-5, 1), 20);

    //         // イベントの時刻の重複回数を調べる処理
    //         if(i){
    //             // console.log(eventStartDate.getDate() , oldStartDate.getDate(), startHour , oldStartHour)
    //             if(eventStartDate.getDate() == oldStartDate.getDate() && startHour == oldStartHour)duplicate_same_hour += 1;
    //             else duplicate_same_hour = 0;
    //             if(duplicate_over_day && date_end_long[duplicate_over_day-1] < eventStartDate){
    //                 // console.log(date_end_long[duplicate_over_day-1])
    //                 duplicate_over_day -= 1;
    //             }
    //             // console.log(duplicate_same_hour,duplicate_over_day)
    //         }
    //         let duplicate = duplicate_same_hour + duplicate_over_day + 1;
    //         calendar.addEvent(events[i], i, duplicate);

    //         if(task_renew_required){
    //             if(events[i].title.slice(0, 4) === "task"
    //             && ((events[i].color == 11 && eventStartDate < todayDate) // 現在日程より前の時刻の場合に
    //             || (events[i].color == 4 && eventStartDate - todayDate < 86400000) // 現在日程の一日後より前の時刻の場合に
    //             || (events[i].color == 1 && eventStartDate - todayDate < 172800000) // 現在日程の2日後より前の時刻の場合に
    //             || (events[i].color == 9 && eventStartDate - todayDate < 604800000) // 現在日程の１週間後より前の時刻の場合に
    //             )){renewTask(events[i], eventStartDate, events[i].color);}
    //         }

    //         oldStartDate = eventStartDate;
    //         oldStartHour = startHour;

    //         skip = 0;
    //     }else skip++;
    // }
    const event_list = getGasEventList("modify");
    // if(localStorage["element_modify"] != undefined)Promise.all(reload_console.postEvents([{type: "modify", data: JSON.parse(localStorage["element_modify"])}], {"get_required": true}))
    console.log("event_list", event_list)
    console.log("event_list.length", event_list.length)
    if(event_list.length > 0)Promise.all(reload_console.postEvents([{type: "modify", data: event_list}], {"get_required": true}))
        .then(() => {
            reload_console.getEvents().then((data)=>{
                display(data, true);//saveCalendarEventsToDB(data);
                reload_console.display_button.stop("🔄");
                saveCalendarEvents(data);
                console.log("post events 完了")
            });
        });
}

export function getCalendarEvents(){
    let events = JSON.parse(localStorage.getItem("stored_events"));
    console.log("stored_event", events);
    display(events, false);
}

export function saveCalendarEvents(received_data){
    localStorage.setItem("stored_events", JSON.stringify(received_data));
    // 更新があったら今日/明日の小カレンダーも更新
    try{ displayTodayTomorrow(); }catch(e){console.log(e)}
}

export function displayTodayTomorrow(){
    let events = JSON.parse(localStorage.getItem("stored_events")) || [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const next = new Date(today.getTime() + 604800000);

    const filtered = events.filter(e => {
        const d = new Date(e.date_start);
        const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return day.getTime() >= today.getTime() && day.getTime() < next.getTime();
    });

    // decide range to render
    let date_start = today;
    let date_end = next;
    if(filtered.length > 0){
        let min = new Date(filtered[0].date_start);
        let max = new Date(filtered[0].date_end);
        for(let ev of filtered){
            const s = new Date(ev.date_start);
            const e = new Date(ev.date_end);
            if(s < min) min = s;
            if(e > max) max = e;
        }
        date_start = new Date(min.getFullYear(), min.getMonth(), min.getDate());
        date_end = new Date(max.getFullYear(), max.getMonth(), max.getDate());
    }

    const date_start_sunday = new Date(date_start.getFullYear(), date_start.getMonth(), date_start.getDate() - (date_start.getDay()%7));
    const date_end_saturday = new Date(date_end.getFullYear(), date_end.getMonth(), date_end.getDate() + ((6 - date_end.getDay())%7));

    // clear any existing mini calendar and render into the today_container element
    // const parent = document.getElementById("today_container");
    // if(!parent) return;
    // // ensure it's empty
    // while(parent.firstChild) parent.removeChild(parent.firstChild);

    mini_calendar.make(date_start_sunday, date_end_saturday);

    // add the filtered events to the mini calendar
    for(let i = 0; i < filtered.length; i++){
        if(filtered[i].color != 1 && filtered[i].color != 9){
            try{ mini_calendar.addEvent(filtered[i], i, 1); }catch(e){console.log(e)}
        }
    }
}

export function countUpTimer(flag, no_save){
    let date_start;
    let date = new Date();
    let count;
    let id = "timer";
    if(!flag){
        date_start = new Date(localStorage.getItem("study_start_date"));
        count = Number(localStorage.getItem("studyTimeSeconds"));
        if(no_save == undefined)count += Math.floor((date - date_start)/1000);
        if(localStorage.getItem("isstudy") != 0)setTimeout(()=>countUpTimer(flag), 1000);
        else localStorage.setItem("studyTimeSeconds", count);
    }
    else {
        date_start = new Date(localStorage.getItem("hobby_start_date"));
        count = Number(localStorage.getItem("hobbyTimeSeconds"));
        if(no_save == undefined)count += Math.floor((date - date_start)/1000);
        if(localStorage.getItem("ishobby") != 0)setTimeout(()=>countUpTimer(flag), 1000);
        else localStorage.setItem("hobbyTimeSeconds", count);
    }
    document.getElementById(id).innerText=Math.floor(count/3600).toString().padStart(2, "0")+":"+Math.floor((count/60)%60).toString().padStart(2, "0")+" "+(count%60).toString().padStart(2, "0");
}

export function searchParent(element){
    let parent = element.parentElement;
    if(parent.nodeName == "BODY")return [element];
    else{
        let elements = searchParent(parent);
        elements.push(element)
        return elements;
    }
}

export function pushLocalStorage(key, data){ // ローカルストレージにデータを追加・更新する関数
    let datas = JSON.parse(localStorage.getItem("element_" + key));
    if(datas){
        let modified = false;
        if("id" in data){ // 変更対象がidで指定されている場合
            for(let stored_data of datas){ // 保存されているデータを総当たり
                if(stored_data.id == data.id){ // idが一致した場合
                    for(let key in data)stored_data[key] = data[key]; // データを更新
                    modified = true;
                    break;
                }
            }
        }
        if(!modified)datas.push(data); // 新規追加の場合
    }
    else datas = [data];
    localStorage["element_" + key] = JSON.stringify(datas);
    reload_console.counters[key].counter.textContent = datas.length;
}

export function deleteLocalStorage(key, data){ // ローカルストレージのデータを削除する関数
    let datas = JSON.parse(localStorage.getItem("element_" + key));
    if(datas){
        if("id" in data){ // 削除対象がidで指定されている場合
            for(let i in datas){ // 保存されているデータを総当たり
                if(datas[i].id == data.id){ // idが一致した場合
                    datas.splice(i, 1); // 配列から削除
                    break;
                }
            }
        }
        localStorage["element_" + key] = JSON.stringify(datas);
        reload_console.counters[key].counter.textContent = datas.length;
    }
}


const usageData = [
    {
    date: "2026-10-08T09:00:00",
    duration: "100s",
    category: "game"
    },
    {
    date: "2026-10-08T10:00:00",
    duration: "150s",
    category: "tv"
    },
    {
    date: "2026-10-08T11:00:00",
    duration: "200s",
    category: "game"
    },
    {
    date: "2026-10-08T13:00:00",
    duration: "300s",
    category: "study"
    },
    {
    date: "2026-10-09T09:00:00",
    duration: "500s",
    category: "game"
    }
];


// ============================================
// durationを秒に変換
// ============================================

function durationToSeconds(duration) {
    const match = String(duration).match(
    /^(\d+(?:\.\d+)?)\s*(s|m|h)$/
    );

    if (!match) {
    return 0;
    }

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
    case "s":
        return value;

    case "m":
        return value * 60;

    case "h":
        return value * 60 * 60;

    default:
        return 0;
    }
}


// ============================================
// 秒を見やすい形式に変換
// ============================================

function formatDuration(seconds) {
    seconds = Math.round(seconds);

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const result = [];

    if (hours > 0) {
    result.push(`${hours}時間`);
    }

    if (minutes > 0) {
    result.push(`${minutes}分`);
    }

    if (secs > 0 || result.length === 0) {
    result.push(`${secs}秒`);
    }

    return result.join(" ");
}


// ============================================
// カテゴリー一覧を生成
// ============================================

const categorySelect = document.getElementById("category");

const categories = [
    ...new Set(usageData.map(item => item.category))
];

categories.forEach(category => {
    const option = document.createElement("option");

    option.value = category;
    option.textContent = category;

    categorySelect.appendChild(option);
});


// ============================================
// Chart.js
// ============================================

const ctx = document
    .getElementById("usageChart")
    .getContext("2d");

let usageChart = null;


// ============================================
// データをフィルタリング
// ============================================

function getFilteredData() {

    const selectedCategory =
    document.getElementById("category").value;

    const startDate =
    document.getElementById("startDate").value;

    const endDate =
    document.getElementById("endDate").value;

    return usageData.filter(item => {

    // カテゴリー
    if (
        selectedCategory !== "all" &&
        item.category !== selectedCategory
    ) {
        return false;
    }

    const date = new Date(item.date);

    // 開始日
    if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);

        if (date < start) {
        return false;
        }
    }

    // 終了日
    if (endDate) {
        const end = new Date(`${endDate}T23:59:59`);

        if (date > end) {
        return false;
        }
    }

    return true;
    });
}


// ============================================
// グラフ更新
// ============================================

function updateChart() {
    // 関数の説明
    

    const filteredData = getFilteredData();

    // -----------------------------
    // 合計時間
    // -----------------------------

    const totalSeconds = filteredData.reduce(
    (total, item) =>
        total + durationToSeconds(item.duration),
    0
    );

    document.getElementById("totalTime").textContent =
    formatDuration(totalSeconds);


    // -----------------------------
    // 日付ごとに集計
    // -----------------------------

    const dailyUsage = {};

    filteredData.forEach(item => {

    const date = item.date.substring(0, 10);

    if (!dailyUsage[date]) {
        dailyUsage[date] = 0;
    }

    dailyUsage[date] +=
        durationToSeconds(item.duration);
    });


    const labels = Object.keys(dailyUsage).sort();

    const values = labels.map(
    date => dailyUsage[date]
    );


    // -----------------------------
    // 既存グラフを削除
    // -----------------------------

    if (usageChart) {
    usageChart.destroy();
    }


    // -----------------------------
    // グラフ作成
    // -----------------------------

    usageChart = new Chart(ctx, {

    type: "bar",

    data: {
        labels: labels,

        datasets: [
        {
            label: "使用時間",

            data: values,

            borderWidth: 1
        }
        ]
    },

    options: {

        responsive: true,

        scales: {
        y: {
            beginAtZero: true,

            title: {
            display: true,
            text: "使用時間（秒）"
            }
        },

        x: {
            title: {
            display: true,
            text: "日付"
            }
        }
        },

        plugins: {
        tooltip: {
            callbacks: {
            label: function(context) {
                return formatDuration(context.raw);
            }
            }
        }
        }
    }
    });
}


// ============================================
// フィルター変更時
// ============================================

document
    .getElementById("category")
    .addEventListener("change", updateChart);

document
    .getElementById("startDate")
    .addEventListener("change", updateChart);

document
    .getElementById("endDate")
    .addEventListener("change", updateChart);


// 初期表示
updateChart();
