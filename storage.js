import { createE, date_string } from "./function_basic.js";

const colorCodes = [0, "#7986CB","#33B679","#8E24AA","#E67C73","#F6BF26","#F4511E","#039BE5","#616161","#3F51B5","#0B8043","#D50000"];
const studies = ["activity-study"];
const hobbies = ["activity-game", "activity-tv", "activity-video", "activity-sns", "activity-book", "activity-other"];

class Event{
    // 予定/タスクの内容を表示する要素
    constructor(event_data){
        {/*
        event_data: {
            (category: "plan" | "task" | "study" | "hobby",)
            id: "event_id",
            title: "event_title",
            date_start: yyyy-MM-ddTHH:mm,
            date_end: yyyy-MM-ddTHH:mm,
            color: int,
            description: "event_description",
        }
        */}
        if(event_data.category)this.category = event_data.category;
        else {
            let category = "plan";
            if(event_data.title.slice(0, 4) === "task")category = "task";
            else if(event_data.title.slice(0, 5) === "sssss")category = "study";
            else if(event_data.title.slice(0, 5) === "hhhhh")category = "hobby";
            else if(hobbies.includes(event_data.title.split(":")[0]))category = "hobby";
            else if(studies.includes(event_data.title.split(":")[0]))category = "study";
            this.category = category;
        }
        this.state = "initialized"; // initialized, created, modified, deleted
        this.initial_data = event_data;
        this.event_data = event_data;
        this.id = event_data.id;
        this.date_start = new Date(event_data.date_start);
        this.date_end = new Date(event_data.date_end);
        this.is_viewed = false;
        this.method = {};
    }
    setMoveEvent(){
        let suppressClick = false;
        const bindResizeHandle = (container, mode) => {
            // イベントの開始時間・終了時間を変更するためのハンドルをバインド
            container.addEventListener("pointerdown", (pointerEvent) => {
                console.log("resize")
                if(!window.matchMedia('(max-width:1024px) and (orientation: landscape)').matches) return;
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
                    previewData = { ...this.event_data, date_start: nextStart, date_end: nextEnd, id: this.id };
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
                        window.applyEventUpdate({ ...this.event_data, ...previewData });
                    }
                    suppressClick = false;
                };
                document.addEventListener("pointermove", onMove);
                document.addEventListener("pointerup", onUp);
                document.body.style.userSelect = "none";
            });
        };
        if(this.category !== "task"){
            bindResizeHandle(this.element, "start");
            bindResizeHandle(this.element, "end");
        }

        this.element.addEventListener("click", (event) => {
            console.log(event.target.classList)
            if(event.target.classList.contains("delete_cell") || event.target.nodeName === "SUMMARY")return;
            console.log(event)
            if(suppressClick){
                suppressClick = false;
                return;
            }
            console.log("open register console")
            // register_console.expand();
            this.method.consoleExpand();
            let form = document.getElementById("register_form");
            let date_start = this.event_data.date_start;
            let date_end = this.event_data.date_end;
            form.id.value = this.event_data.id;
            form.title.value = `${this.event_data.title}${this.event_data.description ? "\n" + this.event_data.description : ""}`;
            // register_console.datetime_inputs.set_start_datetime(date_string(date_start, "-", {"required":["year","hour"]}));
            // register_console.datetime_inputs.set_end_datetime(date_string(date_end, "-", {"required":["year","hour"]}));
            this.method.setConsoleDatetime("start", date_string(date_start, "-", {"required":["year","hour"]}));
            this.method.setConsoleDatetime("end", date_string(date_end, "-", {"required":["year","hour"]}));
            let color = colorCodes[this.event_data.color];
            form.color.value = this.event_data.color;
            document.getElementById("colorcircle").style.backgroundColor = color;
            document.getElementById("postbutton").textContent = "変更";
        })

        // this.event_data = event_data;
        // this.id = event_data.id;
        // this.container1 = event_cell;
        // this.initial_data = event_data;
    }
    view(){
        if(this.is_viewed)return;
        // 既に表示している場合は削除してから再度表示する
        if(this.element){this.element.remove();this.element=undefined}
        if(this.state === "deleted")return;
        if(this.category === "study" || this.category === "hobby")return; // スタディとホビーは表示しない
        // イベントの内容を表示する要素を作成
        let date_cell = createE("div", {"className": "date_cell"});
        let title_cell = createE("div", {"className": "title_cell"});
        let mark_cell = createE("div", {"className": "mark_cell portrait_only"});
        let delete_cell = createE("button", {"className": "delete_cell", "innerText": "×"});
        let description_cell = createE("details", {"className": "description_cell"});
        let description_body = createE("div", {"className": "description_body"});
        let summary = createE("summary", {"innerText": "詳細"});
        description_cell.appendChild(summary);
        description_cell.appendChild(description_body);
        let div1 = createE("div", {}, {"width": "100%"});
        let div2 = createE("div", {}, {"display": "flex", "width": "100%", "justify-content": "space-between"});
        let event_cell = createE("div", {"className": "event_cell"});

        // 一番上に日付を表示する．次にタイトルセルと削除ボタンを横並びに表示する．その下に詳細を表示する．
        description_body.innerHTML = this.event_data.description || "";
        description_cell.style.display = this.event_data.description ? "block" : "none";
        div2.appendChild(title_cell);
        div2.appendChild(delete_cell);
        div1.appendChild(div2);
        div1.appendChild(description_cell.cloneNode(true));
        event_cell.appendChild(date_cell);
        event_cell.appendChild(div1);

        //
        let startHour = Math.min(Math.max(this.date_start.getHours()-5, 1), 20);
        let endHour= Math.min(Math.max(this.date_end.getHours()-5, startHour+1), 20);
        // event_cell.style.gridColumn = duplicate+"/6";
        event_cell.style.gridRow = startHour+"/"+endHour;
        this.grid_row = {start: startHour, end: endHour}; // 重なり判定(assignLanes)用

        // イベントの内容を表示する要素にイベントデータを設定
        // タスクの場合は枠線の色を設定し，タイトルの先頭4文字を削除する．
        let color = colorCodes[this.event_data.color];
        if(color == undefined)color = "#039BE5";
        if(this.category === "task"){
            event_cell.style.borderColor = color;
            event_cell.style.padding = 0;
            title_cell.innerText = this.event_data.title.slice(4);
            event_cell.classList.add("portrait_only")
            event_cell.classList.add("task")
        } else {
            event_cell.style.border = "none";
            date_cell.innerText = this.date_start.getHours().toString() + ":" + this.date_start.getMinutes().toString().padStart(2, "0");
            title_cell.style.color = color;
            title_cell.innerText = this.event_data.title;
            event_cell.classList.add("plan")
        }

        // 日付の表示形式を設定
        if(this.date_start.getFullYear() != this.date_end.getFullYear()){
            if(this.category !== "task")date_cell.innerHTML += "\n～" + date_string(this.date_end, "/", {"required": ["year", "hour"]});
            else date_cell.innerHTML += date_string(this.date_end, "/", {"required": ["year", "hour"]});
        }else if(this.date_start.getMonth() != this.date_end.getMonth() || this.date_start.getDate() != this.date_end.getDate()){
            if(this.category !== "task")date_cell.innerText += "\n～" + date_string(this.date_end, "/", {"required": ["hour"]});
            else date_cell.innerText += date_string(this.date_end, "/", {"required": ["hour"]});
        }else if(this.date_start.getHours() != this.date_end.getHours()){
            date_cell.innerText += "～" + this.date_end.getHours().toString().padStart(2, "0") + ":" + this.date_end.getMinutes().toString().padStart(2, "0");
        }else if(this.category === "task"){
            date_cell.innerText += "～" + this.date_end.getHours().toString().padStart(2, "0") + ":" + this.date_end.getMinutes().toString().padStart(2, "0");
        }

        // イベントの状態に応じて背景色を設定
        if(this.state === "created"){
            date_cell.style.backgroundColor = "transparent";
            title_cell.style.backgroundColor = "transparent";
            mark_cell.style.backgroundColor = "transparent";
            event_cell.style.backgroundColor = "#A0FFA0";
        } else if(this.state === "modified"){
            date_cell.style.backgroundColor = "transparent";
            title_cell.style.backgroundColor = "transparent";
            mark_cell.style.backgroundColor = "transparent";
            event_cell.style.backgroundColor = "#fff0f0";
        }

        // イベントの削除ボタンをクリックしたときの処理
        delete_cell.addEventListener('click', () => {
            if(this.state === "created"){
                // deleteLocalStorage("post", {'id': this.id});
                deleteEventStorage("post", this.event_data);
                // reload_console.counters["post"].set(getEventList("post").length);
                this.method.setCounter("post");
            } else {
                pushEventStorage("delete", this.event_data);
                // reload_console.counters["delete"].set(getEventList("delete").length);
                this.method.setCounter("delete");
            }
            // else pushLocalStorage("delete", this.event_data);
            this.remove();
            this.state = "deleted";
        });

        this.element = event_cell;
        this.setMoveEvent()
        this.is_viewed = true;
    }
    modify(event_data){
        let category = "plan";
        if(event_data.title.slice(0, 4) === "task")category = "task";
        else if(event_data.title.slice(0, 5) === "sssss")category = "study";
        else if(event_data.title.slice(0, 5) === "hhhhh")category = "hobby";
        else if(hobbies.includes(event_data.title.split(":")[0]))category = "hobby";
        else if(studies.includes(event_data.title.split(":")[0]))category = "study";
        this.category = category;

        if(this.state === "created"){
            deleteEventStorage("post", event_data);
            pushEventStorage("post", event_data);
            // deleteLocalStorage("post", event_data.event_data_gas);
            // pushLocalStorage("post", event_data.event_data_gas);
        } else {
            pushEventStorage("modify", event_data);
            // reload_console.counters["modify"].set(getEventList("modify").length);
            this.method.setCounter("modify");
            // pushLocalStorage("modify", event_data.event_data_gas);
        }
        if(this.state === "initialized")this.state = "modified";
        this.event_data = event_data;
        this.date_start = new Date(event_data.date_start);
        this.date_end = new Date(event_data.date_end)
        this.is_viewed = false;
    }
    remove(){
        this.element.remove();

        // if((event_data && this.id == event_data.id) || event_data == undefined){
        //     this.element.remove();
        // }
    }
    setMethod(name, fn){
        this.method[name] = fn;
    }
}

const days = ["日", "月", "火", "水", "木", "金", "土"];

// 時間が重なる予定だけを横に並べるため、各予定に列番号(--lane)と、
// 重なっているグループ内の列数(--lanes)をCSS変数として設定する
function assignLanes(events){
    events.sort((a, b) => a.grid_row.start - b.grid_row.start || a.grid_row.end - b.grid_row.end);
    let group = [], laneEnds = [], groupEnd = 0;
    const flush = () => {
        for(const e of group)e.element.style.setProperty("--lanes", laneEnds.length);
        group = []; laneEnds = [];
    };
    for(const e of events){
        const {start, end} = e.grid_row;
        if(start >= groupEnd)flush(); // それまでの予定と重ならない → 新しいグループ
        let lane = laneEnds.findIndex(laneEnd => laneEnd <= start); // 空いている列を探す
        if(lane < 0)lane = laneEnds.push(0) - 1;
        laneEnds[lane] = end;
        e.element.style.setProperty("--lane", lane);
        group.push(e);
        groupEnd = Math.max(groupEnd, end);
    }
    flush();
}

class Day {
    // 1日分のカレンダー作成
    // constructor(date_sunday, i, parentElement) {
    //     let date = new Date(date_sunday);
    //     date.setDate(date.getDate() + i);
    //     let date_index_cell = createE("div", {"className": "date_index_cell", "innerText": date.getMonth()+1+"/"+date.getDate()+"("+days[i]+")"});
    //     let timeline = createE("div", {"className": "timeline"});
    //     let day_cell = createE("div", {"className": "day_cell"});
    //     let display_none_cell = createE("div", {"className": "landscape_only"});
    //     let div = createE("div", {"className": "div"});
    //     if (date.getDay() == 0)date_index_cell.style.color = "orangered";
    //     else if (date.getDay() == 6)date_index_cell.style.color = "darkturquoise";
    //     day_cell.dataset.date = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    //     timeline.date = date;

    //     this.date_index_cell = date_index_cell;
    //     this.timeline = timeline;
    //     this.display = display_none_cell;
    //     this.day_cell = day_cell;
    //     this.element = div;
    //     // this.containers = [];
    //     this.events = [];
    //     this.parentElement = parentElement;
    //     this.date_value = day_cell.dataset.date;

    //     day_cell.appendChild(date_index_cell);
    //     day_cell.appendChild(timeline);
    //     display_none_cell.appendChild(day_cell);
    //     div.appendChild(display_none_cell);
    // }
    constructor(day_data){
        {/*
        day_data: {
            date: yyyy-MM-dd, // 日付
        }
        */}
        this.date_value = new Date(day_data.date);
        this.events = {};
        this.method = {};
    }
    view(){
        // すでに表示されている場合は削除してから再表示する
        if(this.element)this.element.remove();
        // 1日分のカレンダーを表示する
        let date = this.date_value;
        let date_index_cell = createE("div", {"className": "date_index_cell", "innerText": date.getMonth()+1+"/"+date.getDate()+"("+days[date.getDay()]+")"});
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

        day_cell.appendChild(date_index_cell);
        day_cell.appendChild(timeline);
        display_none_cell.appendChild(day_cell);
        div.appendChild(display_none_cell);
        
        if(this.events)for(let event of Object.values(this.events)){
            event.view();
            if(!event.element || event.state == "deleted")continue;
            this.timeline.appendChild(event.element);
            this.display.style.display = "flex";
            this.date_index_cell.style.display = "block";
            this.day_cell.classList.add("has_event");
        }
        // 横向き表示ではタスクは非表示なので、予定だけで重なりを判定する
        if(this.events)assignLanes(Object.values(this.events).filter(e => e.element && e.state !== "deleted" && e.category !== "task"));

        this.date_index_cell.addEventListener("click", () => {
            console.log("open register console")
            this.method.consoleExpand();
            this.method.setConsoleDatetime("start", date_string(date, "-", {"required":["year","hour"]}));
            this.method.setConsoleDatetime("end", date_string(date, "-", {"required":["year","hour"]}));
            document.getElementById("postbutton").textContent = "作成";
        })

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
        //     Event.container2.querySelector(".title_cell").style.backgroundColor = "white";
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
    // modifyEvent(event_data){
    //     this.events[event_data.event_data_gas.id].modifyEvent(event_data)
    // }
    remove(){
        for(let event of this.events)event.remove();
    }
    setMethod(name, fn){
        this.method[name] = fn;
    }
}

class Week{
    // 1週間分のカレンダー作成
    // constructor(date_sunday, parentElement){
    //     let days = [];
    //     let week_cell = createE("div", {"className": "week_cell"});
    //     for(let i = 0; i < 7; i++){
    //         let day = new Day(date_sunday, i, parentElement);
    //         days[i] = day;
    //         week_cell.appendChild(day.element);
    //         for(let k= 0; k<5; k++){
    //             let line = createE("div", {"className": "landscape_only line"}, {"gridRow": 3*(k+1)+1});
    //             day.timeline.appendChild(line);
    //         }
    //     }

    //     this.date_sunday = new Date(date_sunday);
    //     this.days = days;
    //     this.element = week_cell;
    // }
    constructor(week_data){
        {/*
        week_data: {
            date_sunday: yyyy-MM-dd, // その週の最初の日曜日の日付
        }
        */}
        this.date_sunday = new Date(week_data.date_sunday);
        this.days = {};
        for(let date = new Date(this.date_sunday), i = 0; i < 7; date.setDate(date.getDate()+1), i++){
            this.days[date.toLocaleDateString("ja-JP")] = new Day({date: date});
        }
        this.is_viewed = false;
    }
    update(week_data){
        for(let day_data of week_data.days){
            this.days[day_data.date].remove();
            this.days[day_data.date] = new Day(day_data);
        }
    }
    view(date_start, date_end){
        // すでに表示されている場合は削除してから再表示する
        if(this.element){
            this.element.remove();
        }
        // 1週間分のカレンダーを表示する
        let week_cell = createE("div", {"className": "week_cell"});
        for(let day of Object.values(this.days)){
            if(day.date_value < date_start - 24*60*60*1000 || day.date_value > date_end)continue;
            day.view();
            week_cell.appendChild(day.element);
            for(let k= 0; k<5; k++){
                let line = createE("div", {"className": "landscape_only line"}, {"gridRow": 3*(k+1)+1});
                day.timeline.appendChild(line);
            }
        }
        
        this.element = week_cell;
        this.is_viewed = true;
    }
    remove(){
        for(let day of Object.values(this.days))day.remove();
    }
}

export class Calendar{
    detectDay(dateValue){
        // 指定された日付のDayオブジェクトを返す
        let date_sunday = new Date(dateValue);
        date_sunday.setDate(date_sunday.getDate() - date_sunday.getDay());
        if(!this.weeks) return null;
        let week = this.weeks[date_sunday.toLocaleDateString("ja-JP")];
        if(!week)return null;
        return week.days[dateValue.toLocaleDateString("ja-JP")] || null;
    }
    // カレンダー作成
    constructor(parentElement){
        this.parentElement = parentElement;
        // parentElement: optional DOM element in which to render the calendar (defaults to first .container)

        // 保存されたデータの最古と最新の日曜日はデフォルトで今週の日曜日とする
        const date_now = new Date();
        const date_sunday = new Date(date_now.getFullYear(), date_now.getMonth(), date_now.getDate()-date_now.getDay()%7);
        this.date_start_sunday = new Date(date_sunday);
        this.date_end_sunday = new Date(date_sunday);

        // 表示する際の開始日と終了日を設定
        this.view_date_start = new Date(date_sunday);
        this.view_date_end = new Date(date_sunday);
        this.weeks = {};
        // // 1週間ごとにWeekオブジェクトを作成
        // for(let date_sunday = new Date(this.date_start_sunday); date_sunday <= this.date_end_sunday; date_sunday.setDate(date_sunday.getDate()+7)){
        //     let week = new Week({date_sunday: date_sunday});
        //     this.weeks[date_sunday.toLocaleDateString("ja-JP")] = week;
        // }
        // // イベントを追加
        // for(let event_data of calendar_data.events){
        //     this.detectDay(new Date(event_data.event_data_gas.date_start)).events[event_data.event_data_gas.id] = new Event(event_data);
        // }
        this.method = {};
    }
    update(calendar_data){
        {/*
        calendar_data: {
            date_start: yyyy-MM-dd, // カレンダーの開始週の日曜日
            date_end: yyyy-MM-dd, // カレンダーの終了週の日曜日
            events: [
                {
                    (category: "plan" | "task" | "study" | "hobby",) // イベントの種類
                    id: "event_id",
                    title: "event_title",
                    date_start: yyyy-MM-ddTHH:mm,
                    date_end: yyyy-MM-ddTHH:mm,
                    color: int,
                    description: "event_description",
                }
            ] // イベントの配列
        }
        */}
        let date_start = this.date_start_sunday;
        let date_end = this.date_end_sunday;
        for(let event_data of calendar_data.events){
            date_start = Math.min(date_start, new Date(event_data.date_start));
            date_end = Math.max(date_end, new Date(event_data.date_end));
        }
        date_start = new Date(date_start);
        date_end = new Date(date_end);

        this.date_start_sunday = new Date(date_start.getFullYear(), date_start.getMonth(), date_start.getDate());
        this.date_end_sunday = new Date(date_end.getFullYear(), date_end.getMonth(), date_end.getDate());
        this.date_start_sunday.setDate(this.date_start_sunday.getDate()-this.date_start_sunday.getDay()); // カレンダーの開始週の日曜日を取得
        this.date_end_sunday.setDate(this.date_end_sunday.getDate()-this.date_end_sunday.getDay()); // カレンダーの終了週の日曜日を取得
        console.log("date_start_sunday", this.date_start_sunday)
        console.log("date_end_sunday", this.date_end_sunday)

        // 1週間ごとにWeekオブジェクトを作成
        const week_list = Object.values(this.weeks);
        for(let date_sunday = new Date(this.date_start_sunday); date_sunday <= this.date_end_sunday; date_sunday.setDate(date_sunday.getDate()+7)){
            if(this.weeks[date_sunday.toLocaleDateString("ja-JP")] === undefined){
                let week = new Week({date_sunday: date_sunday});
                week_list.push(week);
            }
        }
        week_list.sort((a, b) => a.date_sunday - b.date_sunday);
        this.weeks = {};
        for(let week of week_list){
            this.weeks[week.date_sunday.toLocaleDateString("ja-JP")] = week;
        }
        // if(date_start_sunday < this.date_start_sunday){
        //     // 新しいカレンダーの開始日が現在のカレンダーの開始日より前の場合、前の週を追加する
        //     for(let date_sunday = new Date(date_start_sunday); date_sunday <= this.date_start_sunday; date_sunday.setDate(date_sunday.getDate()+7)){
        //         this.weeks[date_sunday.toLocaleDateString("ja-JP")] = new Week({date_sunday: date_sunday});
        //     }
        //     this.date_start_sunday = new Date(date_start_sunday);
        // }
        // if(date_end_sunday > this.date_end_sunday){
        //     // 新しいカレンダーの終了日が現在のカレンダーの終了日より後の場合、後の週を追加する
        //     for(let date_sunday = new Date(this.date_end_sunday); date_sunday <= date_end_sunday; date_sunday.setDate(date_sunday.getDate()+7)){
        //         this.weeks[date_sunday.toLocaleDateString("ja-JP")] = new Week({date_sunday: date_sunday});
        //     }
        //     this.date_end_sunday = new Date(date_end_sunday);
        // }
        const daily_event_data = {}
        for(let event_data of calendar_data.events){
            // 更新するイベントのデータをまず日ごとに分ける
            // こうすることである日の既に登録されているイベントデータを削除しやすい
            const event_date = new Date(event_data.date_start);
            const event_date_0 = new Date(event_date.getFullYear(), event_date.getMonth(), event_date.getDate());
            const one_day_events = daily_event_data[event_date_0.toLocaleDateString("ja-JP")];
            if(one_day_events)one_day_events.push(event_data);
            else daily_event_data[event_date_0.toLocaleDateString("ja-JP")] = [event_data];
        }
        for(let date in daily_event_data){
            const one_day_events = daily_event_data[date];
            const day = this.detectDay(new Date(date));
            day.events = {}; //既に登録されているイベントデータを削除
            if(this.method)day.method = this.method;
            for(let event_data of one_day_events){
                const event = new Event(event_data);
                if(this.method)event.method = this.method;
                day.events[event_data.id] = event;
            }
        }
    }
    view(){
        // すでに表示されている場合は削除してから再表示する
        // if(this.element)this.element.remove();
        // 指定された範囲のカレンダーを表示する
        for(let week of Object.values(this.weeks)){
            if(week.date_sunday < this.view_date_start - 6*24*60*60*1000 || week.date_sunday > this.view_date_end){
                if(week.is_viewed){
                    week.element.remove();
                }
                continue;
            }
            week.view(this.view_date_start, this.view_date_end);
            this.parentElement.appendChild(week.element);
        }
        return this.weeks;
    }
    canPlaceEvent(dateValue, startDate, endDate){
        if(!this.weeks) return true;
        for(let week of Object.values(this.weeks)){
            for(let day of week.days){
                if(day.date_value === dateValue){
                    return day.canPlaceEvent(startDate, endDate);
                }
            }
        }
        return true;
    }
    // イベントの追加
    addEvent(event_data, i, duplicate, delete_id){
        console.log("addEvent", event_data)
        let date_start = new Date(event_data.date_start);
        // let date_end = new Date(event_data.event_data_gas.date_end);
        // let element_event = new Event(date_start, date_end, event_data, delete_id);
        // element_event.calendar = this;
        // let num_day = Math.floor((date_start - this.weeks[0].date_sunday)/86400000);
        // let startHour = Math.min(Math.max(date_start.getHours()-5, 1), 20);
        // let endHour= Math.min(Math.max(date_end.getHours()-5, startHour+1), 20);
        let event = new Event(event_data);
        event.state = "created";
        if(this.method)event.method = this.method;
        this.detectDay(date_start).events[event_data.id] = event;
        pushEventStorage("post", event.event_data);
        // reload_console.counters["post"].set(getEventList("post").length);
        this.method.setCounter("post");
        // let week = this.weeks[Math.floor(num_day/7)];
        // if(week != undefined){
        //     // week.days[num_day%7].element.classList.remove("landscape_only")
        //     // week.days[num_day%7].element.classList.remove("portrait_only")
        //     week.days[num_day%7].addEvent(element_event, i, startHour, endHour, duplicate);
        // }
    }
    // イベントの変更
    modifyEvent(event_data){
        console.log("modifyEvent")
        if(this.detectDay(new Date(event_data.date_start)).events[event_data.id])this.detectDay(new Date(event_data.date_start)).events[event_data.id].modify(event_data);
        else {
            let is_found = false;
            let event;
            for(let week of Object.values(this.weeks)){
                for(let day of Object.values(week.days)){
                    if(day.events[event_data.id]){
                        event = day.events[event_data.id];
                        event.modify(event_data);
                        delete day.events[event_data.id];
                        is_found = true;
                        break;
                    }
                }
                if(is_found == true)break;
            }
            if(event)this.detectDay(new Date(event_data.date_start)).events[event_data.id] = event;
        }
        // for(let week of this.weeks){
        //     for(let day of week.days)day.modifyEvent(event_data);
        // }
    }
    // イベントの削除
    remove(event_data){
        if(event_data){
            if(this.weeks){
                this.detectDay(new Date(event_data.date_start)).events[event_data.id].remove();
                // let date_start = new Date(event.date_start);
                // let num_day = Math.floor((date_start - this.weeks[0].date_sunday)/86400000);
                // let week = this.weeks[Math.floor(num_day/7)];
                // if(week != undefined)week.days[num_day%7].remove(event);
            }
        } else {
            if(this.taskContainer){
                while(this.taskContainer.firstChild)this.taskContainer.firstChild.remove();
            }
            for(let element of this.parentElement.querySelectorAll(".event_cell")){
                element.remove();
            }
            if(this.weeks)for(let week of Object.values(this.weeks)){
                week.remove();
                week.element.remove();
            }
        }
    }
    toJSON(){
        // カレンダーのデータをJSON形式で返す
        let events = [];
        for(let week of Object.values(this.weeks)){
            for(let day of Object.values(week.days)){
                for(let event of Object.values(day.events)){
                    // 各イベントのデータをJSON形式で取得
                    events.push({
                        ...event.event_data,
                        category: event.category,
                    });
                }
            }
        }
        return {
            date_start: this.date_start_sunday.toLocaleDateString("ja-JP"),
            date_end: this.date_end_sunday.toLocaleDateString("ja-JP"),
            events: events
        }
    }
    setMethod(name, fn){
        this.method[name] = fn;
        for(let week of Object.values(this.weeks)){
            for(let day of Object.values(week.days)){
                day.setMethod(name, fn);
                if(day.events)for(let event of Object.values(day.events)){
                    event.setMethod(name, fn);
                }
            }
        }
    }
}

function migrate(saved_data){
    if(saved_data.calendar === undefined){
        saved_data.calendar = {
            date_start: new Date(), // 
            date_end: new Date(), // 
            events: [] // イベントの配列
        }
    }
    else if(saved_data.calendar.events[0].event_data_gas){
        const event_datas = []
        for(let event_data of saved_data.calendar.events){
            event_datas.push({
                category: event_data.category,
                ...event_data.event_data_gas
            })
        }
        saved_data.calendar.events = event_datas;
    }
    if(saved_data.post === undefined)saved_data.post = {};
    if(saved_data.modify === undefined)saved_data.modify = {};
    if(saved_data.delete === undefined)saved_data.delete = {};
}

class appStorage{
    constructor(){
        console.log("constructor appStorage")
        this.storage = localStorage;
        let saved_data = JSON.parse(this.storage["calendar-app"] || "{}");
        migrate(saved_data)
        this.calendar = new Calendar(document.getElementsByClassName("container")[0]);
        if(saved_data){
            if(this.calendar)this.calendar.update(saved_data.calendar);
            this.post = saved_data.post;
            this.modify = saved_data.modify;
            this.delete = saved_data.delete;
            this.study_time = saved_data.study_time;
            this.hobby_time = saved_data.hobby_time;
        }
    }
    saveStorage(){
        let event_datas = [];
        let i = 0;
        for(let event_storage of [this.post, this.modify, this.delete]){
            event_datas[i] = []
            for(let event_data of Object.values(event_storage))event_datas[i].push(event_data);
            i++;
        }
        let storage_data = {
            calendar: this.calendar.toJSON(),
            post: event_datas[0],
            modify: event_datas[1],
            delete: event_datas[2],
            // post: this.post,
            // modify: this.modify,
            // delete: this.delete,
            study_time: this.study_time,
            hobby_time: this.hobby_time
        }
        this.storage.setItem("calendar-app", JSON.stringify(storage_data));
    }
}

let storage = new appStorage();

console.log("appStorage", storage);

export function getStorage(){
    return storage;
}

export function saveStorage(){
    storage.saveStorage();
}

export function viewCalendar(){
    storage.calendar.view();
}

export function getStoredEvents(){ // ローカルストレージからイベントを取得する関数
    let stored_events = storage.calendar.toJSON();
    if(stored_events){
        return stored_events.events;
    }
}

export function getEventStorage(key){ // ローカルストレージからイベントを取得する関数
    let stored_datas = storage[key];
    if(stored_datas){
        return stored_datas;
    }
}

export function getEventList(key){
    const event_storage = storage[key];
    const event_list = [];
    for(let event of Object.values(event_storage)){
        event_list.push(event);
    }
    return event_list;
}

export function resetEditedEvent(key){
    const event_storage = storage[key];
    if(key == "delete")for(let event of Object.values(event_storage))event.state = "initialized";
    else if(key == "modify")for(let event of Object.values(event_storage))event.event_data = event.initial_data;
    else if(key == "post")for(let event of Object.values(event_storage))event.state = "deleted";
    for(let event of Object.values(event_storage))event.is_viewed = false;
    storage[key] = {};
}

export function clearEventStorage(key){
    storage[key] = {};
}

export function getGasEventList(key){
    const event_storage = storage[key];
    console.log(event_storage)
    const event_list = [];
    for(let event of Object.values(event_storage)){
        event_list.push(event.event_data);
    }
    return event_list;
}

export function pushEventStorage(key, event_data){ // 追加・変更・削除したイベントをappStorageに追加・更新する関数
    /*
    event_data: {
        (category: "plan" | "task" | "study" | "hobby",) // イベントの種類
        id: "event_id",
        title: "event_title",
        date_start: yyyy-MM-ddTHH:mm,
        date_end: yyyy-MM-ddTHH:mm,
        color: int,
        description: "event_description",
    }
    */
    let stored_datas = storage[key];
    if(stored_datas){
        stored_datas[event_data.id] = event_data;
    }
    else storage[key] = {[event_data.id]: event_data};
    // storage.saveStorage();要修正
}

export function deleteEventStorage(key, event_data){ // ローカルストレージのデータを削除する関数
    let stored_datas = storage[key];
    if(stored_datas){
        delete stored_datas[event_data.id]; // オブジェクトから削除
    }
    // storage.saveStorage();要修正
}

export function setMethod(name, fn){
    console.log(typeof fn)
    storage.calendar.setMethod(name, fn);
}