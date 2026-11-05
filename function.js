import { reload_console } from "./class.js";
import { createE } from "./function_basic.js"
import { getStorage, viewCalendar, getGasEventList } from "./storage.js";

const date = new Date();
const todayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
const hobbies = ["activity-game", "activity-tv", "activity-video", "activity-sns", "activity-book", "activity-other"];

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
    viewCalendar();
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
                // saveCalendarEvents(data);
                saveStorage()
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