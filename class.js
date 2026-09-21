import { createE, date_string, str2date, pushLocalStorage, deleteLocalStorage } from "./function.js";

const colorCodes = [0, "#7986CB","#33B679","#8E24AA","#E67C73","#F6BF26","#F4511E","#039BE5","#616161","#3F51B5","#0B8043","#D50000"];
const days = ["日", "月", "火", "水", "木", "金", "土"];

class Calendar{
    // カレンダー作成
    constructor(parentElement){
        this.parentElement = parentElement;
    }
    // parentElement: optional DOM element in which to render the calendar (defaults to first .container)
    make(date_start, date_end){
        this.remove();
        let weeks = [];
        if(this.parentElement == undefined)this.parentElement = document.getElementsByClassName("container")[0];
        for(let date_sunday = new Date(date_start), i = 0; date_sunday <= date_end; date_sunday.setDate(date_sunday.getDate()+7), i++){
            let week = new Week(date_sunday, this.parentElement);
            this.parentElement.appendChild(week.element);
            weeks[i] = week;
        }

        this.weeks = weeks;

        return this.weeks
    }
    canPlaceEvent(dateValue, startDate, endDate){
        if(!this.weeks) return true;
        for(let week of this.weeks){
            for(let day of week.days){
                if(day.date_value === dateValue){
                    return day.canPlaceEvent(startDate, endDate);
                }
            }
        }
        return true;
    }
    // イベントの追加
    addEvent(event, i, duplicate, delete_id){
        let date_start = new Date(event.date_start);
        let date_end = new Date(event.date_end);
        let element_event = new Event(date_start, date_end, event, delete_id);
        element_event.calendar = this;
        let num_day = Math.floor((date_start - this.weeks[0].date_sunday)/86400000);
        let startHour = Math.min(Math.max(date_start.getHours()-5, 1), 20);
        let endHour= Math.min(Math.max(date_end.getHours()-5, startHour+1), 20);
        let week = this.weeks[Math.floor(num_day/7)];
        if(week != undefined){
            // week.days[num_day%7].element.classList.remove("landscape_only")
            // week.days[num_day%7].element.classList.remove("portrait_only")
            week.days[num_day%7].addEvent(element_event, i, startHour, endHour, duplicate);
        }
    }
    // イベントの変更
    modifyEvent(event_data){
        for(let week of this.weeks){
            for(let day of week.days)day.modifyEvent(event_data);
        }
    }
    // イベントの削除
    remove(event){
        if(event){
            if(this.weeks){
                let date_start = new Date(event.date_start);
                let num_day = Math.floor((date_start - this.weeks[0].date_sunday)/86400000);
                let week = this.weeks[Math.floor(num_day/7)];
                if(week != undefined)week.days[num_day%7].remove(event);
            }
        } else {
            if(this.taskContainer){
                while(this.taskContainer.firstChild)this.taskContainer.firstChild.remove();
            }
            for(let element of this.parentElement.querySelectorAll(".event_container")){
                element.remove();
            }
            if(this.weeks)for(let week of this.weeks){
                week.remove();
                week.element.remove();
            }
        }
    }
}

class Week{
    // 1週間分のカレンダー作成
    constructor(date_sunday, parentElement){
        let days = [];
        let week_cell = createE("div", {"className": "week_cell"});
        for(let i = 0; i < 7; i++){
            let day = new Day(date_sunday, i, parentElement);
            days[i] = day;
            week_cell.appendChild(day.element);
            for(let k= 0; k<5; k++){
                let line = createE("div", {"className": "landscape_only line"}, {"gridRow": 3*(k+1)+1});
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
    // 1日分のカレンダー作成
    constructor(date_sunday, i, parentElement) {
        let date = new Date(date_sunday);
        date.setDate(date.getDate() + i);
        let date_index_cell = createE("div", {"className": "date_index_cell", "innerText": date.getMonth()+1+"/"+date.getDate()+"("+days[i]+")"});
        let timeline = createE("div", {"className": "timeline"});
        let day_cell = createE("div", {"className": "day_cell"});
        let display_none_cell = createE("div", {"className": "landscape_only"});
        let div = createE("div", {"className": "div"});
        if (date.getDay() == 0)date_index_cell.style.color = "orangered";
        else if (date.getDay() == 6)date_index_cell.style.color = "darkturquoise";
        day_cell.dataset.date = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
        timeline.date = date;

        this.date_index_cell = date_index_cell;
        this.timeline = timeline;
        this.display = display_none_cell;
        this.day_cell = day_cell;
        this.element = div;
        // this.containers = [];
        this.events = [];
        this.parentElement = parentElement;
        this.date_value = day_cell.dataset.date;

        day_cell.appendChild(date_index_cell);
        day_cell.appendChild(timeline);
        display_none_cell.appendChild(day_cell);
        div.appendChild(display_none_cell);
    }
    // イベントの追加
    addEvent(Event, i, startHour, endHour, duplicate){
        // console.log("day add")
        // イベントの配置
        // if(this.containers[startHour] != undefined){
        //     // すでに同じ時間帯にイベントがある場合
        //     this.containers[startHour].addEvent(Event, endHour, duplicate);
        // } else {
        //     // 初めての時間帯のイベントの場合
        //     this.containers[startHour] = new Container(Event, this.timeline, i, startHour, endHour, duplicate, this.parentElement);
        // }
        if(Event.container1){
            Event.container1.style.gridColumn = duplicate+"/6";
            Event.container1.style.gridRow = startHour+"/"+endHour;
        }

        // if(Event.container2){
        //     Event.container2.querySelector(".event_cell").style.backgroundColor = "white";
        //     // Event.container2.style.gridColumn = duplicate+"/1";
        //     Event.container2.style.gridRow = startHour+"/"+endHour;
        //     this.timeline.appendChild(Event.container2);
        // }
        this.timeline.appendChild(Event.container1);
        // console.log(this.timeline, Event.container1)
        if(!this.events.includes(Event))this.events.push(Event);
        this.display.style.display = "flex";
        this.date_index_cell.style.display = "block";
        this.day_cell.classList.add("has_event");
    }
    canPlaceEvent(startDate, endDate){
        // イベントの配置可能かどうかを判定
        const startMinutes = startDate.getHours()*60 + startDate.getMinutes();
        const endMinutes = endDate.getHours()*60 + endDate.getMinutes();
        if(endMinutes <= startMinutes) return true;
        // for(let container of this.containers){
        //     if(!container) continue;
            for(let event of this.events){
                const eventData = event.initial_data || {};
                const eventStart = new Date(eventData.date_start);
                const eventEnd = new Date(eventData.date_end);
                const eventStartMinutes = eventStart.getHours()*60 + eventStart.getMinutes();
                const eventEndMinutes = eventEnd.getHours()*60 + eventEnd.getMinutes();
                // Check for overlap
                if(startMinutes < eventEndMinutes && endMinutes > eventStartMinutes){
                    // 重なりがある場合は配置できない
                    // console.log("Cannot place event due to overlap with existing event:", eventData);
                    return false;
                }
            }
        // }
        return true;
    }
    // イベントの変更
    modifyEvent(event_data){
        // for(let container of this.containers){
        //     if(container)for(let event of container.events){
        //         if(event && event.id == event_data.id)event.modifyEvent(event_data);
        //     }
        // }
        for(let event of this.events){
            if(event && event.id == event_data.id)event.modifyEvent(event_data);
        }
    }
    remove(event_data){
        // if(event)for(let container of this.containers)if(container)container.remove(event);
        // else for(let container of this.containers)if(container)container.remove();
    
        if(event_data)for(let event of this.events)event.remove(event_data);
        else for(let event of this.events)event.remove();
    }
}

class Container {
    // 同じ時間帯のイベントをまとめるコンテナ
    constructor(Event, timeline, i, startHour, endHour, duplicate, parentElement) {
        // console.log("create container", Event, startHour, endHour, duplicate)

        let event_container_container = createE("div", {"className": "event_grid landscape_only"}, {"backgroundColor": "hsla("+i*159+", 100%, 50%, 0.05)", "border": "solid 0.1px hsla("+i*159+", 100%, 0%, 0.2)", "gridRow": startHour+"/"+endHour});
        Event.container1.style.gridColumn = duplicate+"/6";
        Event.container1.style.gridRow = startHour+"/"+endHour;
        timeline.appendChild(Event.container1);
        // console.log("append container1", Event.container1)
        if(Event.container2){
            event_container_container.appendChild(Event.container2);
        }
        timeline.insertBefore(event_container_container, timeline.firstChild);
        this.element = event_container_container;
        this.timeline = timeline;
        this.events = [Event];
    }
    // 同じ時間帯のイベントをまとめるコンテナにイベントを追加
    addEvent(Event, endHour, duplicate){
        // 重複時の折りたたみ処理
        if(this.events.length <= 1){
            let event_container_details = createE("details", {"className": "event_grid landscape_only"});
            event_container_details.appendChild(createE("summary", {"innerText": ""}));
            if(this.events[0].container2){
                this.events[0].container2.querySelector(".event_cell").style.backgroundColor = "white";
            }
            this.details = event_container_details;
        }
        if(this.element.style.gridRowEnd < endHour)this.element.style.gridRowEnd = endHour;
        Event.container1.style.gridColumn = duplicate+"/6";
        if(Event.container2){
            Event.container2.querySelector(".event_cell").style.backgroundColor = "white";
            this.element.appendChild(Event.container2);
        }
        this.details.querySelector("summary").innerText = this.events.length+1;
        this.timeline.appendChild(Event.container1);
        this.events.push(Event);
    }
    remove(event_data){
        if(event_data)for(let event of this.events)event.remove(event_data);
        else for(let event of this.events)event.remove();
    }
}

class Event{
    // 予定/タスクの内容を表示する要素
    constructor(eventStartDate, date_end, event_data, delete_id){
        let date_cell = createE("div", {"className": "date_cell"});
        let event_cell = createE("div", {"className": "event_cell"});
        // let event_cell = createE("div", {"className": "event_cell portrait_only"});
        // let event_cell2 = createE("div", {"className": "event_cell landscape_only"});
        let mark_cell = createE("div", {"className": "mark_cell portrait_only"});
        let delete_cell = createE("button", {"className": "delete_cell", "innerText": "×"});
        let description_cell = createE("details", {"className": "description_cell"});
        let description_body = createE("div", {"className": "description_body"});
        let summary = createE("summary", {"innerText": "詳細"});
        description_cell.appendChild(summary);
        description_cell.appendChild(description_body);
        let div1 = createE("div", {}, {"width": "100%"});
        let div2 = createE("div", {}, {"display": "flex", "width": "100%", "justify-content": "space-between"});
        let div3 = createE("div", {}, {"display": "flex"});
        let event_container = createE("div", {"className": "event_container"});
        let event_container2 = null;

        let date_cell2 = createE("div", {"className": "date_cell"});
        let delete_cell2 = createE("button", {"className": "delete_cell", "innerText": "×"});
        let mark_cell2 = createE("div", {"className": "mark_cell portrait_only"});
        let desc_cell2 = createE("details", {"className": "description_cell"});
        let desc_body2 = createE("div", {"className": "description_body"});
        desc_cell2.appendChild(createE("summary", {"innerText": "詳細"}));
        desc_cell2.appendChild(desc_body2);

        this.isTask = (event_data.title || "").slice(0, 4) === "task";
        // if(!this.isTask){
            // div3.appendChild(date_cell);
            // div3.appendChild();
            div2.appendChild(event_cell);
            div2.appendChild(delete_cell);
            div1.appendChild(div2);
            div1.appendChild(description_cell.cloneNode(true));
            event_container.appendChild(date_cell);
            event_container.appendChild(div1);
            event_container.classList.add("landscape_only")
        // } else {
        //     date_cell.style.right = "0px";
        //     delete_cell.style.justifySelf = "end";
        //     event_container.appendChild(event_cell);
        //     event_container.appendChild(description_cell.cloneNode(true));
        //     event_container.appendChild(date_cell);
        //     event_container.appendChild(delete_cell);
        //     event_container.classList.add("portrait_only")
        // }
        this.set(event_container, event_data);

        let color = colorCodes[event_data.color];
        if(color == undefined)color = "#039BE5";
        // console.log("isTask", this.isTask)
        // if(!this.isTask){
        //     div2.appendChild(date_cell2);
        //     div2.appendChild(delete_cell2);
        //     event_container2 = createE("div", {"className": "event_container landscape_only"});
        //     event_container2.appendChild(div2);
        //     event_container2.appendChild(mark_cell2);
        //     event_container2.appendChild(event_cell2);
        //     event_container2.appendChild(desc_cell2);
        // }
        // if(event_container2)this.set(event_container2, event_data);
        // console.log(event_data.title)

        if(delete_id != undefined){
            date_cell.style.backgroundColor = "transparent";
            event_cell.style.backgroundColor = "transparent";
            mark_cell.style.backgroundColor = "transparent";
            event_container.style.backgroundColor = "#A0FFA0";
            if(event_container2)event_container2.style.backgroundColor = "#A0FFA0";
        }

        delete_cell.addEventListener('click', () => {
            if(delete_id != undefined)deleteLocalStorage("post", {'id': delete_id});
            else pushLocalStorage("delete", event_data);
            this.remove();
        });
        if(event_container2){
            delete_cell2.addEventListener('click', () => {
                if(delete_id != undefined)deleteLocalStorage("post", {'id': delete_id});
                else pushLocalStorage("delete", event_data);
                this.remove();
            });
        }

        let suppressClick = false;
        const bindResizeHandle = (container, mode) => {
            // イベントの開始時間・終了時間を変更するためのハンドルをバインド
            container.addEventListener("pointerdown", (pointerEvent) => {
                console.log("resize")
                const rect = container.getBoundingClientRect();
                console.log(pointerEvent.clientY - rect.top,rect.bottom - pointerEvent.clientY)
                const isTop = pointerEvent.clientY - rect.top < 8;
                const isBottom = rect.bottom - pointerEvent.clientY < 8;
                if((mode === "start" && !isTop) || (mode === "end" && !isBottom)) return;
                pointerEvent.preventDefault();
                pointerEvent.stopPropagation();
                suppressClick = true;
                const baseStart = new Date(this.event_data.date_start);
                const baseEnd = new Date(this.event_data.date_end);
                const basehour = (baseEnd - baseStart)/3600000;
                let previewData = null;
                const onMove = (moveEvent) => {
                    // moveEvent.targetがtimeline自体とは限らない（時刻線や他の予定の上を通ることがある）ので、
                    // 祖先方向にtimelineを探す。見つからない場合のみ、ドラッグ開始時の日付にフォールバックする。
                    let timeline = moveEvent.target.closest(".timeline") || container.closest(".timeline");
                    if(!timeline) return;
                    const timelineRect = timeline.getBoundingClientRect();
                    const offset = Math.max(0, Math.min(timelineRect.height, moveEvent.clientY - timelineRect.top));
                    const hour = Math.max(0, Math.min(23, 6 + Math.round((offset / Math.max(timelineRect.height, 1)) * 18)));
                    let nextStart = new Date(timeline.date);
                    let nextEnd = new Date(timeline.date);
                    if(mode === "start"){
                        nextStart.setHours(hour, 0, 0, 0);
                        if(24 <= hour + basehour) nextStart.setHours(24-basehour, 0, 0, 0);
                        nextEnd.setHours(nextStart.getHours()+basehour, 0, 0, 0);
                    } else {
                        // 終了時刻の変更では開始時刻は変えない。
                        // ここでnextStartをtimeline.date（ポインタ位置の日の0時）のまま放置すると、
                        // 開始時刻が0時に巻き戻ってしまうため、元の開始時刻を明示的に引き継ぐ。
                        nextStart = new Date(baseStart);
                        nextEnd.setHours(hour, 0, 0, 0);
                        if(nextEnd <= nextStart) nextEnd = new Date(nextStart.getTime() + 3600000);
                    }
                    console.log(mode, hour, nextStart, nextEnd)
                    previewData = { ...event_data, date_start: nextStart, date_end: nextEnd };
                    this.event_data = previewData;
                    this.modifyEvent(previewData)
                    // if(this.container1) this.set(this.container1, previewData);
                    // if(this.container2) this.set(this.container2, previewData);
                };
                const onUp = () => {
                    console.log("onUp")
                    document.removeEventListener("pointermove", onMove);
                    document.removeEventListener("pointerup", onUp);
                    document.body.style.userSelect = "";
                    if(previewData && window.applyEventUpdate){
                        window.applyEventUpdate({ ...event_data, ...previewData });
                    }
                    suppressClick = false;
                };
                document.addEventListener("pointermove", onMove);
                document.addEventListener("pointerup", onUp);
                document.body.style.userSelect = "none";
            });
        };
        if(!this.isTask){
            bindResizeHandle(event_container, "start");
            bindResizeHandle(event_container, "end");
        }

        for(let cell of [date_cell, event_cell, mark_cell]){
            cell.addEventListener("click", (event) => {
                if(suppressClick){
                    suppressClick = false;
                    return;
                }
                console.log("open register console")
                register_console.expand();
                let form = document.getElementById("register_form");
                let date_start = this.event_data.date_start;
                let date_end = this.event_data.date_end;
                form.id.value = this.event_data.id;
                form.title.value = `${this.event_data.title}${this.event_data.description ? "\n" + this.event_data.description : ""}`;
                form.start.value = date_string(date_start, "/", {"required":["year","hour"]});
                form.end.value = date_string(date_end, "/", {"required":["year","hour"]});
                form.datetime_start.value = date_string(date_start, "-", {"required":["year","hour"]});
                form.datetime_end.value = date_string(date_end, "-", {"required":["year","hour"]});
                form.color.value = this.event_data.color;
                document.getElementById("colorcircle").style.backgroundColor = color;
                document.getElementById("postbutton").textContent = "変更";
            })
        }

        this.event_data = event_data;
        this.id = event_data.id;
        this.container1 = event_container;
        this.container2 = event_container2;        
        this.initial_data = event_data;
    }
    set(event_container, event_data){
        let date_cell = event_container.querySelector(".date_cell");
        let event_cell = event_container.querySelector(".event_cell");
        // let mark_cell = event_container.querySelector(".mark_cell");
        let description_cell = event_container.querySelector(".description_cell");
        let description_body = event_container.querySelector(".description_body");
        let date_start = new Date(event_data.date_start);
        let date_end = new Date(event_data.date_end);
        if(!this.isTask)date_cell.innerText = date_start.getHours().toString() + ":" + date_start.getMinutes().toString().padStart(2, "0");

        let color = colorCodes[event_data.color];
        if(color == undefined)color = "#039BE5";
        if(this.isTask){
            event_container.style.borderColor = color;
            // event_container.style.border = "none";
            // event_container.style.borderRadius = 0;
            event_container.style.padding = 0;
            // event_container.style.opacity = 0.5;
            // event_cell.style.width = "61%";
            // event_cell.style.color = "white";
            // mark_cell.innerText = "◆";
            // mark_cell.style.visibility = "visible";
            // mark_cell.style.width = "4%";
            // mark_cell.style.color = color;
            event_cell.innerText = event_data.title.slice(4);
        }
        else {
            event_container.style.border = "none";
            event_cell.style.color = color;
            event_cell.innerText = event_data.title;
        }
        description_body.innerHTML = event_data.description || "";
        description_cell.style.display = event_data.description ? "block" : "none";
        if(date_start.getFullYear() != date_end.getFullYear()){
            if(!this.isTask)date_cell.innerHTML += "\n～" + date_string(date_end, "/", {"required": ["year", "hour"]});
            else date_cell.innerHTML += date_string(date_end, "/", {"required": ["year", "hour"]});
        }else if(date_start.getMonth() != date_end.getMonth() || date_start.getDate() != date_end.getDate()){
            if(!this.isTask)date_cell.innerText += "\n～" + date_string(date_end, "/", {"required": ["hour"]});
            else date_cell.innerText += date_string(date_end, "/", {"required": ["hour"]});
        }else if(date_start.getHours() != date_end.getHours()){
            date_cell.innerText += "～" + date_end.getHours().toString().padStart(2, "0") + ":" + date_end.getMinutes().toString().padStart(2, "0");
        }else if(this.isTask){
            date_cell.innerText += "～" + date_end.getHours().toString().padStart(2, "0") + ":" + date_end.getMinutes().toString().padStart(2, "0");
        }
    }
    modifyEvent(event_data){
        if(event_data.candel != true){
            this.container1.style.backgroundColor = "#fff0f0";
            if(this.container2)this.container2.style.backgroundColor = "#fff0f0";
        } else {
            event_data = this.initial_data;
            this.container1.style.backgroundColor = "white";
            if(this.container2)this.container2.style.backgroundColor = "white";
        }
        let num_day = Math.floor((event_data.date_start - this.calendar.weeks[0].date_sunday)/86400000);
        let startHour = Math.min(Math.max(event_data.date_start.getHours()-5, 1), 20);
        let endHour= Math.min(Math.max(event_data.date_end.getHours()-5, startHour+1), 20);
        let week = this.calendar.weeks[Math.floor(num_day/7)];
        if(week != undefined)week.days[num_day%7].addEvent(this, 0, startHour, endHour, 0);
        this.set(this.container1, event_data);
        if(this.container2)this.set(this.container2, event_data);
    }
    remove(event_data){
        if((event_data && this.id == event_data.id) || event_data == undefined){
            this.container1.remove();
            if(this.container2)this.container2.remove();
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
            if(localStorage["element_" + type]){
                console.log(localStorage["element_" + type])
                Promise.all(reload_console.postEvents([{type: type, data: JSON.parse(localStorage["element_" + type])}], {"get_required": false}))
            } else clearTimeout(this.button.timeout);
        })
        clear.addEventListener('click', event => { // 予定作成、変更、削除キューの中身をクリアする
            event.preventDefault();
            if(localStorage["element_" + type]){
                if(type == "delete"){ // 予定削除キューをクリアした際に、表示から消した予定を再表示する
                    for(let element_data of JSON.parse(localStorage["element_delete"])){
                        calendar.addEvent(element_data, 0, 0);
                    }
                }
                if(type == "modify"){ // 予定変更キューをクリアした際に、変更した予定の内容を戻す
                    for(let element_data of JSON.parse(localStorage["element_modify"])){
                        element_data["candel"] = true;
                        calendar.modifyEvent(element_data);
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
        this.text = button.textContent;
        this.timeout = null;
    }
    start(){
        clearTimeout(this.timeout);
        this.element.textContent = this.text;
        if(this.dots)for(let i = 0; i < 8; i++)this.dots[i].remove();
        let dots = [];
        for(let i = 0; i < 8; i++){
            let dot = createE("div", {}, {
                "position":"absolute","left":"50%","top":"50%",
                "height":"10%","aspect-ratio":"1/1","transform":"translate(-50%, -50%)",
                "border-radius":"50%","border":"solid 1px lightcyan","background-color":"teal","visibility":"hidden","transition":"0.5s ease"});
            this.element.parentElement.appendChild(dot);
            dots.push(dot);
        }
        this.dots = dots;
        for(let i = 0; i < 8; i++){
            setTimeout(() => {
                this.dots[i].style.visibility = "visible";
                this.dots[i].style.left = (50+35*Math.cos(Math.PI*i/4))+"%";
                this.dots[i].style.top = (50+35*Math.sin(Math.PI*i/4))+"%";
            }, 0);
        }
        this.change(0);
    }
    change(i){
        this.dots[(i+3)%4].style.height = "10%";
        this.dots[(i+3)%4+4].style.height = "10%";
        this.dots[i%4].style.height = "20%";
        this.dots[i%4+4].style.height = "20%";
        this.dots[0].style.visibility = "visible";
        this.timeout = setTimeout(() => this.change(i+1), 250);
    }
    stop(text){
        clearTimeout(this.timeout);
        for(let i = 0; i < 8; i++){
            this.dots[i].style.left = "50%";
            this.dots[i].style.top = "50%";
        }
        if(text){
            this.element.textContent = "完了";
        }
        this.timeout = setTimeout(() => {
            this.element.textContent = text;
            for(let i = 0; i < 8; i++)this.dots[i].remove();
        }, 500);
    }
}

class ColorCircle{
    constructor(div, select){
        this.opened_count = 0;
        this.state = "closed"
        this.dots = [];
        let index = [8, 8, 7, 11, 4, 1, 9, 3, 5, 2, 6, 10];
        let TRANSTIME = 50;
        for(let i in colorCodes){
            let dot = createE("div", {}, {"position":"absolute","width":"1.8em","height":"1.8em","border-radius":"0.4em","border":"solid 1px gray","background-color":colorCodes[index[colorCodes.length - i - 1]],"visibility":"hidden","transition":"0.05s ease"});
            if(colorCodes.length - i == 1)dot.style.border = "0px";
            div.appendChild(dot);
            dot.addEventListener('click', ()=>{
                div.style.backgroundColor = dot.style.backgroundColor;
                select.value = index[colorCodes.length - i - 1];
            });
            this.dots.push(dot);
        }
        div.addEventListener('click', ()=>{
            if(this.state == "closed"){
                this.state = "opening";
                for(let i = 0; i < 6; i++){
                    setTimeout(()=>{this.open(Number(i)+1)}, TRANSTIME * i);
                }
                setTimeout(()=>{this.state = "opened"}, TRANSTIME * 6);
            }
            else if(this.state == "opened"){
                this.state = "closing";
                for(let i = 0; i < 6; i++){
                    setTimeout(()=>{this.open(5-i)}, TRANSTIME * i);
                }
                setTimeout(()=>{this.state = "closed"}, TRANSTIME * 6);
            }
        })
    }
    open(count){
        if(count <= colorCodes.length){
            for(let i in colorCodes){
                if((i < 4 && i >= 6 - count) || (i > 3 && i < 8 && i >= 9 - count) || (i > 7 && i < 12 && i >= 12 - count))this.dots[i].style.visibility = "visible";
                else this.dots[i].style.visibility = "hidden";
                let shift = Math.floor(i/4);
                this.dots[i].style.transform = "translate("+(2*Math.max(Math.min(3 - i % 4, count + shift - 3), 0))+"em,"+(2*Math.max(Math.min(2 - shift, count - 1), 1 - shift))+"em)";
                
                // if(i < count){
                //     this.dots[colorCodes.length - i - 1].style.transform = "translate("+(60*(1 - Math.cos(Math.PI*(count - i)/6)))+"px,"+(60*Math.sin(-Math.PI*(count - i)/6))+"px)";
                //     this.dots[colorCodes.length - i - 1].style.visibility = "visible";
                // } else {
                //     this.dots[colorCodes.length - i - 1].style.transform = "translate(0px, 0px)";
                //     this.dots[colorCodes.length - i - 1].style.visibility = "hidden";
                // }
            }
        }
    }
}

export const consoles = []

class Console{
    constructor(console_element){
        this.element = console_element;
        this.display_button = new Button(console_element.querySelector("button"));
        this.mode = "out";
        let doubleClickTimer = null;
        this.display_button.element.addEventListener("click", event =>{
            console.log("click")
            if(doubleClickTimer){
                clearTimeout(doubleClickTimer);
                doubleClickTimer = null;
                event.preventDefault();
                return;
            }
            doubleClickTimer = setTimeout(() => {
                doubleClickTimer = null;
                console.log("double click")
                console.log(this.mode)
                if(this.mode == "in"){
                    this.shrink();
                } else {
                    this.expand();
                }
            }, 225);
            return;
        })
        document.getElementsByClassName("button_container")[0].appendChild(console_element.querySelector("div"));
        // 子inputの情報に外部からアクセスできるようにする
        let inputs = console_element.querySelectorAll("input");
        for(let input of inputs)this[input.name] = input;
    }
    expand(){
        console.log("expand", this.element)
        for(let console of consoles){
            console.shrink();
        }

        this.element.style.transform = 'translateX(-50%) translateY(0%) scale(1)';
        this.display_button.element.style.backgroundColor = "#ff4014";
        this.mode = "in";
    }
    shrink(){
        this.element.style.transform = 'translateX(-50%) translateY(130%) scale(0.95)';
        this.display_button.element.style.backgroundColor = "coral";
        this.mode = "out";
    }
}

export const calendar = new Calendar(document.getElementsByClassName("container")[0]);

// 小カレンダー用インスタンス（今日／明日表示などに使用）
export const mini_calendar = new Calendar(document.getElementsByClassName("container")[1]);

new ColorCircle(document.getElementById("colorcircle"), document.getElementById("register_form").color)

export const reload_console = new Console(document.getElementById("reload_console"));
export const register_console = new Console(document.getElementById("register_console"));
const url_console = new Console(document.getElementById("url_console"));
export const timer_console = new Console(document.getElementById("timer_console"));
const history_console = new Console(document.getElementById("history_console"));
const apiurl_console = new Console(document.getElementById("apiurl_console"));
consoles.push(reload_console, register_console, url_console, timer_console, history_console, apiurl_console);

reload_console.sync_button = new Button(reload_console.element.querySelector("button"));
reload_console.counters = {post: new Counter("post"), modify: new Counter("modify"), delete: new Counter("delete")};
timer_console.send_button = new Button(document.getElementById("studysend"));