const http_options = {
    'method' : 'post',
    'headers': {
        'Content-Type': "application/x-www-form-urlencoded",
    },
    'body' : '' //送りたいデータをpayloadに配置してJSON形式変換。
};
const date = new Date();
const todayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
const colorCodes = [0, "#7986CB","#33B679","#8E24AA","#E67C73","#F6BF26","#F4511E","#039BE5","#616161","#3F51B5","#0B8043","#D50000"];
const days = ["日", "月", "火", "水", "木", "金", "土"];

class Calendar{
    make(date_start, date_end){
        this.remove();
        let weeks = [];
        for(let date_sunday = new Date(date_start), i = 0; date_sunday <= date_end; date_sunday.setDate(date_sunday.getDate()+7), i++){
            let week = new Week(date_sunday);
            document.getElementsByClassName("container")[0].appendChild(week.element);
            weeks[i] = week;
        }

        this.weeks = weeks;

        return this.weeks
    }
    addEvent(event, i, duplicate, delete_id){
        let date_start = new Date(event.date_start);
        let date_end = new Date(event.date_end);
        let num_day = Math.floor((date_start - this.weeks[0].date_sunday)/86400000);
        let startHour = Math.min(Math.max(date_start.getHours()-5, 1), 20);
        let endHour= Math.min(Math.max(date_end.getHours()-5, startHour+1), 20);
        let element_event = new Event(date_start, date_end, event, delete_id);
        let week = this.weeks[Math.floor(num_day/7)];
        if(week != undefined)week.days[num_day%7].addEvent(element_event, i, startHour, endHour, duplicate);
    }
    remove(event){
        if(event){
            let date_start = new Date(event.date_start);
            let num_day = Math.floor((date_start - this.weeks[0].date_sunday)/86400000);
            let week = this.weeks[Math.floor(num_day/7)];
            if(week != undefined)week.days[num_day%7].remove(event);
        } else if(this.weeks)for(let week of this.weeks){
            week.remove();
            week.element.remove();
        }
    }
}
class Week{
    constructor(date_sunday){
        let days = [];
        let week_cell = createE("div", {"className": "week_cell"});
        for(let i = 0; i < 7; i++){
            let day = new Day(date_sunday, i);
            days[i] = day;
            week_cell.appendChild(day.element);
            for(let k= 0; k<5; k++){
                let line = createE("div", {"className": "display_none_cell line"}, {"gridRow": 3*(k+1)+1});
                day.timeline.appendChild(line);
            }
        }

        this.date_sunday = new Date(date_sunday);
        this.days = days;
        this.element = week_cell;
    }
    remove(){
        for(let day of this.days)day.remove();
    }
}

class Day {
    constructor(date_sunday, i) {
        let date = new Date(date_sunday);
        date.setDate(date.getDate() + i);
        let date_index_cell = createE("div", {"className": "date_index_cell", "innerText": date.getMonth()+1+"/"+date.getDate()+"("+days[i]+")"});
        let timeline = createE("div", {"className": "timeline"});
        let day_cell = createE("div", {"className": "day_cell"});
        let display_none_cell = createE("div", {"className": "display_none_cell"});
        let div = createE("div", {"className": "div"});
        if (date.getDay() == 0)date_index_cell.style.color = "orangered";
        else if (date.getDay() == 6)date_index_cell.style.color = "darkturquoise";

        this.date_index_cell = date_index_cell;
        this.timeline = timeline;
        this.display = display_none_cell;
        this.element = div;
        this.containers = [];

        day_cell.appendChild(date_index_cell);
        day_cell.appendChild(timeline);
        display_none_cell.appendChild(day_cell);
        div.appendChild(display_none_cell);
    }
    addEvent(Event, i, startHour, endHour, duplicate){
        // イベントの配置
        if(this.containers[startHour] != undefined){
            // すでに同じ時間帯にイベントがある場合
            this.containers[startHour].addEvent(Event, endHour, duplicate);
        } else {
            // 初めての時間帯のイベントの場合
            this.containers[startHour] = new Container(Event, this.timeline, i, startHour, endHour, duplicate);
        }
        this.display.style.display = "flex";
    }
    remove(event){
        if(event)for(let container of this.containers)if(container)container.remove(event);
        else for(let container of this.containers)if(container)container.remove();
    }
}

class Container {
    constructor(Event, timeline, i, startHour, endHour, duplicate) {
        let event_container_container = createE("div", {"className": "event_grid"}, {"backgroundColor": "hsla("+i*159+", 100%, 50%, 0.05)", "border": "solid 0.1px hsla("+i*159+", 100%, 0%, 0.2)", "gridRow": startHour+"/"+endHour});
        Event.container1.style.gridColumn = duplicate+"/6";
        event_container_container.appendChild(Event.container1);
        event_container_container.appendChild(Event.container2);
        timeline.insertBefore(event_container_container, timeline.firstChild);
        this.element = event_container_container;
        this.events = [Event];
    }
    addEvent(Event, endHour, duplicate){
        // 重複時の折りたたみ処理
        if(this.events.length <= 1){
            let event_container_details = createE("details", {"className": "event_grid display_none_cell"});
            event_container_details.appendChild(createE("summary", {"innerText": ""}));
            this.events[0].container2.querySelector(".event_cell").style.backgroundColor = "white";
            event_container_details.appendChild(this.events[0].container2);
            this.element.appendChild(event_container_details);
            this.details = event_container_details;
        }
        if(this.element.style.gridRowEnd < endHour)this.element.style.gridRowEnd = endHour;
        Event.container1.style.gridColumn = duplicate+"/6";
        Event.container2.querySelector(".event_cell").style.backgroundColor = "white";
        this.details.querySelector("summary").innerText = this.events.length+1;
        this.element.appendChild(Event.container1);
        this.details.appendChild(Event.container2);
        this.events.push(Event);
    }
    remove(event_data){
        if(event_data)for(let event of this.events)event.remove(event_data);
        else for(let event of this.events)event.remove();
    }
}

class Event{
    constructor(eventStartDate, date_end, event_data, delete_id){
        let date_cell = createE("input", {"type": "text", "className": "date_cell", "value": eventStartDate.getHours().toString() + ":" + eventStartDate.getMinutes().toString().padStart(2, "0")});
        let event_cell = createE("input", {"type": "text", "className": "event_cell display_land_none_cell", "value": event_data.title});
        let event_cell2 = createE("div", {"className": "event_cell display_none_cell", "innerText": event_data.title});
        let mark_cell = createE("input", {"type": "text", "className": "mark_cell display_land_none_cell"});
        let event_container = createE("div", {"className": "event_container"});
        let event_container2 = createE("div", {"className": "event_container"});
        if(eventStartDate.getFullYear() != date_end.getFullYear()){
            date_cell.value += "\n～" + date_string(date_end, "/", {"required": ["year", "hour"]});
        }else if(eventStartDate.getMonth() != date_end.getMonth() || eventStartDate.getDate() != date_end.getDate()){
            date_cell.value += "\n～" + date_string(date_end, "/", {"required": ["hour"]});
        }else if(eventStartDate.getHours() != date_end.getHours()){
            date_cell.value += "～" + date_end.getHours().toString().padStart(2, "0") + ":00";
        }
        if(delete_id != undefined){
            date_cell.style.backgroundColor = "transparent";
            event_cell.style.backgroundColor = "transparent";
            mark_cell.style.backgroundColor = "transparent";
            event_container.style.backgroundColor = "#A0FFA0";
        }

const colorCodes = [0, "#7986CB","#33B679","#8E24AA","#E67C73","#F6BF26","#F4511E","#039BE5","#616161","#3F51B5","#0B8043","#D50000"];
        let color = colorCodes[event_data.color];
        if(color == undefined)color = "#039BE5";
        if(event_data.color == 4 || event_data.color == 1 || event_data.color == 9){
            event_cell.style.width = "61%";
            mark_cell.value = "◆";
            mark_cell.style.visibility = "visible";
            mark_cell.style.width = "4%";
            mark_cell.style.color = color;
            event_cell2.innerHTML = "<span style='color:"+color+"'>◆ </span>"+event_cell2.innerHTML;
        }
        else {event_cell.style.color = color;event_cell2.style.color = color;}

        for(let element of [date_cell, event_cell]){
            element.addEventListener("change", (event) =>{
                event.target.style.backgroundColor = "#fff0f0";
                let element_data = {
                    "id": event_data.id
                }
                if(event.target.className == "date_cell"){
                    // 日付の区切り：-, /　時間の区切り：:　日付と時間の区切り：/,  , T
                    let new_date = event.target.value.split(/~|～|\n/, 2); // 開始と終了で分割
                    if(new_date[1] == undefined)new_date[1] = new_date[0]; // 終了が無い場合は開始と同じとみなす
                    for(let j = 0; j < 2; j++)new_date[j] = str2date(new_date[j], new Date(event_data.date_start));
                    // console.log(new_date)
                    element_data["date_start"] = new_date[0];
                    element_data["date_end"] = new_date[1];
                }
                if(event.target.className.includes("event_cell"))element_data["title"] = event.target.value;
                if(event.target.className.includes("mark_cell"))element_data["mark"] = event.target.value;
                pushLocalStorage("modify", element_data);
            })
        }
        let delete_cell = createE("button", {"className": "delete_cell", "innerText": "削除"});
        delete_cell.addEventListener('click', () => {
            // var result = confirm("本当に\""+event_data.title+"\"を削除しますか？");
            // if(result){
                if(delete_id != undefined)deleteLocalStorage("post", {'id': delete_id});
                else pushLocalStorage("delete", event_data);
                this.remove();
            // }
        });

        this.id = event_data.id;
        this.container1 = event_container;
        this.container2 = event_container2;

        event_container.appendChild(date_cell);
        event_container.appendChild(mark_cell);
        event_container.appendChild(event_cell);
        event_container.appendChild(delete_cell);
        event_container2.appendChild(event_cell2);
    }
    remove(event_data){
        if((event_data && this.id == event_data.id) || event_data == undefined){
            this.container1.remove();
            this.container2.remove();
        }
    }
}

class Counter{
    constructor(type){
        let divs = document.getElementById(type + "_counter").querySelectorAll("div");
        console.log(divs)
        this.counter = divs[0].querySelectorAll("p")[1];
        let submit = divs[1].querySelectorAll("button")[0];
        let clear = divs[1].querySelectorAll("button")[1];
        this.button = new Button(submit);
        submit.addEventListener('click', event => {
            event.preventDefault();
            this.button.start();
            if(localStorage["element_" + type]){
                console.log(localStorage["element_" + type])
                postEvents(type, JSON.parse(localStorage["element_" + type]), {"get_required": false})
                .then(()=>this.button.stop("📤"))
                .catch(()=>this.button.stop("Error"));
            }
        })
        clear.addEventListener('click', event => { // 予定作成、変更、削除キューの中身をクリアする
            event.preventDefault();
            if(localStorage["element_" + type]){
                if(type == "delete"){ // 予定削除キューをクリアした際に、表示から消した予定を再表示する
                    for(let element_data of JSON.parse(localStorage["element_delete"])){
                        calendar.addEvent(element_data, 0, 0);
                    }
                }
                if(type == "post"){ // 予定作成キューをクリアした際に、表示した予定を削除する
                    for(let element_data of JSON.parse(localStorage["element_post"])){
                        console.log(element_data)
                        calendar.remove(element_data);
                    }
                }
                localStorage.removeItem("element_" + type);
            }
            this.counter.textContent = 0;
        })
    }
    set(number){this.counter.textContent = number}
}

class Button{
    constructor(button){
        this.element = button;
        this.pending = false; //現在待機中であるか
        this.end = false; //待機が終わった直後であるか
        this.text = "📤";
    }
    start(){
        if(!this.end){
            this.pending = true;
            this.change();
        } else {//待機が終わった直後であれば0.5秒待ってから始める
            setTimeout(() => {
                this.pending = true;
                this.change();
            }, 500);
        }
    }
    change(){
        let cell = this.element;
        if(!this.end){
            if(cell.textContent == ">")cell.textContent = ">>";
            else if(cell.textContent == ">>")cell.textContent = ">>>";
            else cell.textContent = ">";
            setTimeout(() => this.change(), 500);
        } else {
            cell.textContent = "完了";
            this.pending = false;
            this.end = false;
            setTimeout(() => cell.textContent = this.text, 500);
        }
    }
    stop(text){
        this.end = true;
        if(text)this.text = text;
    }
}

export const calendar = new Calendar();

const counter = [new Counter("post"), new Counter("modify"), new Counter("delete")]
export const counter_elements = {
    "post": counter[0].counter,
    "modify": counter[1].counter,
    "delete": counter[2].counter,
}
export const buttons = {
    "post": counter[0].button,
    "modify": counter[1].button,
    "delete": counter[2].button,
    "sync": new Button(document.getElementById("getbutton")),
    "timersend": new Button(document.getElementById("studysend")),
}

export function date_string(date, separator, options){
    let date_string = "";
    if(options.month_offset != undefined)date.setMonth(date.getMonth() + options.month_offset);
    if(options.required.includes("year"))date_string += date.getFullYear().toString();
    date_string += separator + (date.getMonth() + 1).toString().padStart(2, "0")
    date_string += separator + date.getDate().toString().padStart(2, "0")
    if(options.required.includes("hour") && separator == "-")date_string += "T" + date.getHours().toString().padStart(2, "0") + ":00";
    if(options.required.includes("hour") && separator == "/")date_string += " " + date.getHours().toString() + ":" + date.getMinutes().toString().padStart(2, "0");
    return date_string;
}

function str2date(date_string, defaultDate){
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
    buffer[1] = buffer[1].split(/時|分/).map((p) => p = p.padStart(2, '0')).join(":"); // 時間部分をhh:mm形式に変換
    if(!buffer[1].match(/^\d{2}:\d{2}/)){ // 時、分が無い場合
        if(buffer[1].match(/^\d{2}/)){ // 分が有る場合は:00を付け足す
            buffer[1] += ":00";
        } else buffer[1] += "00:00";
    }
    
    return new Date(buffer.join(" ")); // 日付と時間で分割
}

export function get_events(startDate, endDate){
    return new Promise((resolve, reject) => {
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
        fetch(localStorage["apiUrl"], http_options)
        .then(response => response.text())
        .then(data => {
            let received_data=JSON.parse(data);
            // console.log(received_data);
            // document.getElementById("postbutton").textContent = "送信";
            if(data.error)document.getElementById("p").innerText = data.error;
            resolve(received_data);
        })
        .catch(error => {
            console.log("reload not complete")
            console.error("Error:", error);
            document.getElementById("p").innerText = error;
            reject(error);
        });
    });
}

export function postEvents(type, datas, options){
    return new Promise((resolve, reject) => {
        console.log(type, datas);
        let received_data;
        let post_data = {"type": type, "datas": datas};
        http_options.body=JSON.stringify(post_data);

        fetch(localStorage["apiUrl"], http_options)
        .then(response => response.text())
        .then(data => {
            console.log(received_data = data);
            let parsed_data = JSON.parse(data);
            resolve(true);
            if(options != undefined && options.cell != undefined)options.cell.textContent = "完了";
            if(type == "post")localStorage.removeItem("element_post");
            if(type == "modify")localStorage.removeItem("element_modify");
            if(type == "delete")localStorage.removeItem("element_delete");
            counter_elements[type].textContent = 0;
            if(options != undefined && options.get_required == true){
                buttons["sync"].start();
                get_events().then((data)=>{
                    display(data, true);//saveCalendarEventsToDB(data);
                    buttons["sync"].stop("同期");
                    saveCalendarEvents(data);
                    console.log("post events 完了")
                }).catch(()=>buttons["sync"].stop("Error"));
            }
            if(parsed_data.error)document.getElementById("p").innerText = parsed_data.error;
        })
        .catch(error => {
            console.error("Error:", error);
            document.getElementById("p").innerText = error + received_data;
            reject(false);
            if(options != undefined && options.cell != undefined)options.cell.textContent = "Error";
        });
    })
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

function countHistory(events, row){
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
export function reload(event, button){
    if(event != undefined){ //ボタンを押して更新する場合
        let date_start = new Date(Date.parse(event.target.start.value));
        let date_end = new Date(Date.parse(event.target.end.value));
        buttons["sync"].start();
        get_events(date_start, date_end).then((data)=>{
            display(data, true);//saveCalendarEventsToDB(data);
            console.log("更新 完了");
            buttons["sync"].stop("同期");
            saveCalendarEvents(data);
        }).catch(()=>buttons["sync"].stop("Error"));
    } else get_events().then((data)=>{display(data, true); console.log("更新 完了"); saveCalendarEvents(data);}); //最初に更新する場合
    const promise2 = new Promise((resolve) =>get_events(todayDate, date, false).then((data)=>resolve(data)));
    let date_old = new Date(todayDate - 86400000);
    const promise3 = new Promise((resolve) =>get_events(date_old, todayDate, false).then((data)=>resolve(data)));
    date_old = new Date(todayDate - 604800000);
    const promise4 = new Promise((resolve) =>get_events(date_old, todayDate, false).then((data)=>resolve(data)));
    Promise.all([promise2, promise3, promise4])
    .then((results) => {
        countHistory(results[0], 2);
        countHistory(results[1], 3);
        countHistory(results[2], 4);
        console.log("ボタン更新2")
        console.log("予定読み込み，履歴読み込み完了");
    })
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

export function button_display(button, console_id){
    console.log(console_id);
    if(document.getElementById(console_id).style.transform == 'scale(1, 1)'){
        document.getElementById(console_id).style.transform = 'scale(0, 0)';
        document.getElementsByClassName("curtain")[0].style.opacity = 0;
        document.getElementsByClassName("curtain")[0].style.visibility = "hidden";
        button.style.backgroundColor = "coral";
    } else {
        let forms = document.getElementsByClassName('console_container')[0].children;
        for(let i = 0; i < forms.length; i++){
            forms[i].style.transform = 'scale(0, 0)';
        }
        let buttons = document.getElementsByClassName('button_container')[0].children;
        for(let i = 0; i < buttons.length; i++){
            buttons[i].style.backgroundColor = 'coral';
        }
        document.getElementById(console_id).style.transform = 'scale(1, 1)';
        document.getElementsByClassName("curtain")[0].style.opacity = 1;
        document.getElementsByClassName("curtain")[0].style.visibility = "visible";
        button.style.backgroundColor = "#ff4014";
    }
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
    counter_elements[key].textContent = datas.length;
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
        counter_elements[key].textContent = datas.length;
    }
}