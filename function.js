import { calendar, reload_console } from "./class.js";

const date = new Date();
const todayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

export function date_string(date, separator, options){
    let date_string = "";
    if(options.month_offset != undefined)date.setMonth(date.getMonth() + options.month_offset);
    if(options.required.includes("year"))date_string += date.getFullYear().toString();
    date_string += separator + (date.getMonth() + 1).toString().padStart(2, "0")
    date_string += separator + date.getDate().toString().padStart(2, "0")
    if(options.required.includes("hour") && separator == "-")date_string += "T" + date.getHours().toString().padStart(2, "0") + ":" + date.getMinutes().toString().padStart(2, "0");;
    if(options.required.includes("hour") && separator == "/")date_string += " " + date.getHours().toString() + ":" + date.getMinutes().toString().padStart(2, "0");
    return date_string;
}

export function str2date(date_string, defaultDate){
    let buffer = date_string.split(/[ T\.日]/);
    console.log("first", buffer)
    if(!buffer[0].match(/[/年月]/))buffer = ["", buffer[0]];
    else if(!buffer[1])buffer = [buffer[0], ""];

    buffer[0] = buffer[0].split(/[/年月]/).map((p) => p = p.padStart(2, '0')).join("-"); // 日付部分をYYYY-MM-DD形式に変換
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
    buffer[1] = buffer[1].split(/[:時分]/).map((p) => p = p.padStart(2, '0')).join(":"); // 時間部分をhh:mm形式に変換
    if(!buffer[1].match(/^\d{2}:\d{2}/)){ // 時、分が無い場合
        if(buffer[1].match(/^\d{2}/)){ // 分が有る場合は:00を付け足す
            buffer[1] += ":00";
        } else buffer[1] += "00:00";
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
    console.log("old_date", new_date);
    if(color == 4)new_date.setDate(todayDate.getDate()+1);
    if(color == 1)new_date.setDate(date.getDate()+7);
    if(color == 9)new_date.setMonth(date.getMonth()+1);
    console.log("new_date", new_date);
    let datas = {
        'id': event_data.id,
        'title': event_data.title,
        'date_start': new_date,
        'date_end': new_date,
        'color': color,
    };
    if(datas.title != ""){
        pushLocalStorage("modify", datas);
    }
}

export function countHistory(events, row){
    let studytime = 0; let hobbytime = 0;
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
    let studyhistory = document.getElementById("history"+row+"2");
    studyhistory.innerText = Math.floor(studytime/3600)+":"+Math.floor((studytime/60)%60).toString().padStart(2, 0)+","+(studytime%60).toString().padStart(2, 0);
    let hobbyhistory = document.getElementById("history"+row+"3");
    hobbyhistory.innerText = Math.floor(hobbytime/3600)+":"+Math.floor((hobbytime/60)%60).toString().padStart(2, 0)+","+(hobbytime%60).toString().padStart(2, 0);
}

function createEventBackground(options, indexElement){
    let event_back = createE("div", {"className": "display_none_cell"}, {
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
    let date_start = new Date(events[0].date_start);
    let date_end = new Date(events[events.length - 1].date_end);
    let date_start_sunday = new Date(date_start.getFullYear(), date_start.getMonth(), date_start.getDate()-date_start.getDay()%7);
    let date_end_saturday = new Date(date_end.getFullYear(), date_end.getMonth(), date_end.getDate()+(6-date_end.getDay())%7);
    console.log("calendar make", calendar.make(date_start_sunday, date_end_saturday));
    console.log("display start");
    let skip = 0;
    let duplicate_same_hour = 0;
    let duplicate_over_day = 0;
    let oldStartDate = new Date(date_start);
    let oldStartHour = Math.min(Math.max(oldStartDate.getHours()-5, 1), 20);
    let date_end_long = new Array(5);
    for(let i = 0; i < events.length; i++){
        if(events[i].color != 3){
            // console.log(events[i].date_start)
            let eventStartDate = new Date(events[i].date_start);
            let startHour = Math.min(Math.max(eventStartDate.getHours()-5, 1), 20);

            // イベントの時刻の重複回数を調べる処理
            if(i){
                // console.log(eventStartDate.getDate() , oldStartDate.getDate(), startHour , oldStartHour)
                if(eventStartDate.getDate() == oldStartDate.getDate() && startHour == oldStartHour)duplicate_same_hour += 1;
                else duplicate_same_hour = 0;
                if(duplicate_over_day && date_end_long[duplicate_over_day-1] < eventStartDate){
                    // console.log(date_end_long[duplicate_over_day-1])
                    duplicate_over_day -= 1;
                }
                // console.log(duplicate_same_hour,duplicate_over_day)
            }
            let duplicate = duplicate_same_hour + duplicate_over_day + 1;
            calendar.addEvent(events[i], i, duplicate);

            if(task_renew_required){
                if((events[i].color == 4 && eventStartDate - todayDate < 86400000) // 現在日程の一日後より前の時刻の場合に
                || (events[i].color == 1 && eventStartDate - todayDate < 172800000) // 現在日程の2日後より前の時刻の場合に
                || (events[i].color == 9 && eventStartDate - todayDate < 604800000) // 現在日程の１週間後より前の時刻の場合に
                ){renewTask(events[i], eventStartDate, events[i].color);}
            }

            oldStartDate = eventStartDate;
            oldStartHour = startHour;

            skip = 0;
        }else skip++;
    }
    if(localStorage["element_modify"] != undefined)Promise.all(reload_console.postEvents([{type: "modify", data: JSON.parse(localStorage["element_modify"])}], {"get_required": true}))
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