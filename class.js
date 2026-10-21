import { createE, date_string, str2date, pushLocalStorage, deleteLocalStorage } from "./function.js";
import { loadStorage, getStorage, getEventStorage, getEventList, resetEditedEvent, getGasEventList, pushEventStorage, deleteEventStorage } from "./storage.js";
const colorCodes = [0, "#7986CB","#33B679","#8E24AA","#E67C73","#F6BF26","#F4511E","#039BE5","#616161","#3F51B5","#0B8043","#D50000"];
const days = ["日", "月", "火", "水", "木", "金", "土"];

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
    }
    update(calendar_data){
        {/*
        calendar_data: {
            date_start: yyyy-MM-dd, // カレンダーの開始週の日曜日
            date_end: yyyy-MM-dd, // カレンダーの終了週の日曜日
            events: [
                {
                    category: "plan" | "task" | "study" | "hobby", // イベントの種類
                    event_data_gas: {
                        id: "event_id",
                        title: "event_title",
                        date_start: yyyy-MM-ddTHH:mm,
                        date_end: yyyy-MM-ddTHH:mm,
                        color: int,
                        description: "event_description",
                    }
                }
            ] // イベントの配列
        }
        */}
        let date_start = this.date_start_sunday;
        let date_end = this.date_end_sunday;
        for(let event_data of calendar_data.events){
            date_start = Math.min(date_start, new Date(event_data.event_data_gas.date_start));
            date_end = Math.max(date_end, new Date(event_data.event_data_gas.date_end));
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
            const event_date = new Date(event_data.event_data_gas.date_start);
            const event_date_0 = new Date(event_date.getFullYear(), event_date.getMonth(), event_date.getDate());
            const one_day_events = daily_event_data[event_date_0.toLocaleDateString("ja-JP")];
            if(one_day_events)one_day_events.push(event_data);
            else daily_event_data[event_date_0.toLocaleDateString("ja-JP")] = [event_data];
        }
        for(let date in daily_event_data){
            const one_day_events = daily_event_data[date];
            const day = this.detectDay(new Date(date));
            day.events = {}; //既に登録されているイベントデータを削除
            for(let event_data of one_day_events){
                day.events[event_data.event_data_gas.id] = new Event(event_data);
            }
        }
    }
    view(){
        // すでに表示されている場合は削除してから再表示する
        // if(this.element)this.element.remove();
        // 指定された範囲のカレンダーを表示する
        for(let week of Object.values(this.weeks)){
            if(week.date_sunday < this.view_date_start - 6*24*60*60*1000 || week.date_sunday > this.view_date_end){
                week.element.remove();
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
        let date_start = new Date(event_data.event_data_gas.date_start);
        // let date_end = new Date(event_data.event_data_gas.date_end);
        // let element_event = new Event(date_start, date_end, event_data, delete_id);
        // element_event.calendar = this;
        // let num_day = Math.floor((date_start - this.weeks[0].date_sunday)/86400000);
        // let startHour = Math.min(Math.max(date_start.getHours()-5, 1), 20);
        // let endHour= Math.min(Math.max(date_end.getHours()-5, startHour+1), 20);
        let event = new Event(event_data);
        event.state = "created";
        this.detectDay(date_start).events[event_data.event_data_gas.id] = event;
        pushEventStorage("post", event);
        reload_console.counters["post"].set(getEventList("post").length);
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
        this.detectDay(new Date(event_data.event_data_gas.date_start)).events[event_data.event_data_gas.id].modify(event_data);
        // for(let week of this.weeks){
        //     for(let day of week.days)day.modifyEvent(event_data);
        // }
    }
    // イベントの削除
    remove(event_data){
        if(event_data){
            if(this.weeks){
                this.detectDay(new Date(event_data.event_data_gas.date_start)).events[event_data.event_data_gas.id].remove();
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
                        category: event.category,
                        event_data_gas: event.event_data
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
    }
    remove(){
        for(let day of Object.values(this.days))day.remove();
    }
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
        
        // イベントの表示
        console.log(this.events)
        if(this.events)for(let event of Object.values(this.events)){
            event.view();
            if(event.element)console.log(event.element.cloneNode())
            if(!event.element || event.state == "deleted")continue;
            this.timeline.appendChild(event.element);
            this.display.style.display = "flex";
            this.date_index_cell.style.display = "block";
            this.day_cell.classList.add("has_event");
        }
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
}

class Event{
    // 予定/タスクの内容を表示する要素
    constructor(event_data){
        {/*
        event_data: {
            category: "plan" | "task" | "study" | "hobby",
            event_data_gas: {
                id: "event_id",
                title: "event_title",
                date_start: yyyy-MM-ddTHH:mm,
                date_end: yyyy-MM-ddTHH:mm,
                color: int,
                description: "event_description",
            }
        }
        */}
        this.category = event_data.category;
        this.state = "initialized"; // initialized, created, modified, deleted
        this.initial_data = event_data.event_data_gas;
        this.event_data = event_data.event_data_gas;
        this.id = event_data.event_data_gas.id;
        this.date_start = new Date(event_data.event_data_gas.date_start);
        this.date_end = new Date(event_data.event_data_gas.date_end);
        this.viewed = false;
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
            if(event.target.classList.contains("delete_cell"))return;
            console.log(event)
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
            register_console.datetime_inputs.set_start_datetime(date_string(date_start, "-", {"required":["year","hour"]}));
            register_console.datetime_inputs.set_end_datetime(date_string(date_end, "-", {"required":["year","hour"]}));
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
        if(this.viewed)return;
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
        event_cell.classList.add("landscape_only")

        // イベントの内容を表示する要素にイベントデータを設定
        // タスクの場合は枠線の色を設定し，タイトルの先頭4文字を削除する．
        let color = colorCodes[this.event_data.color];
        if(color == undefined)color = "#039BE5";
        if(this.category === "task"){
            event_cell.style.borderColor = color;
            event_cell.style.padding = 0;
            title_cell.innerText = this.event_data.title.slice(4);
        } else {
            event_cell.style.border = "none";
            date_cell.innerText = this.date_start.getHours().toString() + ":" + this.date_start.getMinutes().toString().padStart(2, "0");
            title_cell.style.color = color;
            title_cell.innerText = this.event_data.title;
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
                deleteEventStorage("post", this);
                reload_console.counters["post"].set(getEventList("post").length);
            } else {
                pushEventStorage("delete", this);
                reload_console.counters["delete"].set(getEventList("delete").length);
            }
            // else pushLocalStorage("delete", this.event_data);
            this.remove();
            this.state = "deleted";
        });

        this.element = event_cell;
        this.setMoveEvent()
        this.viewed = true;
    }
    modify(event_data){
        this.category = event_data.category;

        if(this.state === "created"){
            deleteEventStorage("post", this);
            pushEventStorage("post", this);
            // deleteLocalStorage("post", event_data.event_data_gas);
            // pushLocalStorage("post", event_data.event_data_gas);
        } else {
            pushEventStorage("modify", this);
            reload_console.counters["modify"].set(getEventList("modify").length);
            // pushLocalStorage("modify", event_data.event_data_gas);
        }
        if(this.state === "initialized")this.state = "modified";
        this.event_data = event_data.event_data_gas;
        this.date_start = new Date(event_data.event_data_gas.date_start);
        this.date_end = new Date(event_data.event_data_gas.date_end)
        this.viewed = false;
    }
    remove(){
        this.element.remove();

        // if((event_data && this.id == event_data.id) || event_data == undefined){
        //     this.element.remove();
        // }
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
            const event_list = getGasEventList(type);
            if(event_list){
                console.log(event_list)
                Promise.all(reload_console.postEvents([{type: type, data: event_list}], {"get_required": false}))
            // if(localStorage["element_" + type]){
                // console.log(localStorage["element_" + type])
                // Promise.all(reload_console.postEvents([{type: type, data: JSON.parse(localStorage["element_" + type])}], {"get_required": false}))
            } else clearTimeout(this.button.timeout);
        })
        clear.addEventListener('click', event => { // 予定作成、変更、削除キューの中身をクリアする
            event.preventDefault();
            // const event_storage = getEventStorage(type);
            // const event_list = getEventList(type);
            // if(event_list){
            resetEditedEvent(type);
            // if(localStorage["element_" + type]){

                // for(let event of event_list){
                //     if(type == "delete")event.state = "initialized";
                //     else if(type == "modify"){
                //         event.event_data = event.initial_data;
                //     }
                //     else if(type == "post")event.state = "deleted";
                // }
                // event_storage = {};

                // if(type == "delete"){ // 予定削除キューをクリアした際に、表示から消した予定を再表示する
                //     for(let element_data of JSON.parse(localStorage["element_delete"])){
                //         calendar.addEvent(element_data, 0, 0);
                //     }
                // }
                // if(type == "modify"){ // 予定変更キューをクリアした際に、変更した予定の内容を戻す
                //     for(let element_data of JSON.parse(localStorage["element_modify"])){
                //         element_data["candel"] = true;
                //         calendar.modifyEvent(element_data);
                //     }
                // }
                // if(type == "post"){ // 予定作成キューをクリアした際に、表示した予定を削除する
                //     for(let element_data of JSON.parse(localStorage["element_post"])){
                //         console.log(element_data)
                //         calendar.remove(element_data);
                //     }
                // }
                // localStorage.removeItem("element_" + type);
            // }
            getStorage().saveStorage();
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

        this.element.style.transform = 'translateX(-50%) translateY(-15%) scale(1)';
        this.display_button.element.style.backgroundColor = "#ff4014";
        this.mode = "in";
    }
    shrink(){
        this.element.style.transform = 'translateX(-50%) translateY(130%) scale(0.95)';
        this.display_button.element.style.backgroundColor = "coral";
        this.mode = "out";
    }
}

// export const calendar = new Calendar(document.getElementsByClassName("container")[0]);
// export const calendar = new Calendar({date_start: new Date(), date_end: new Date(new Date().getTime() + 7*24*60*60*1000), events: []});

// 小カレンダー用インスタンス（今日／明日表示などに使用）
// export const mini_calendar = new Calendar({date_start: new Date(), date_end: new Date(new Date().getTime() + 7*24*60*60*1000), events: []});

new ColorCircle(document.getElementById("colorcircle"), document.getElementById("register_form").color)

loadStorage();

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