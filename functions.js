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
const days = ["月", "火", "水", "木", "金", "土", "日"];

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

export function cellPendingAnimation(cell, type){
    if(cell.textContent == "完了" || cell.textContent == "Error"){
        if(cell.textContent == "完了" && type == "getbutton")cell.textContent = "更新";
    }else{
        if(cell.textContent == ">")cell.textContent = ">>";
        else if(cell.textContent == ">>")cell.textContent = ">>>";
        else cell.textContent = ">";
        setTimeout(() => cellPendingAnimation(cell, type), 500);
    }
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
            document.getElementById("postbutton").textContent = "送信";
            document.getElementById("getbutton").textContent = "完了";
            resolve(received_data);
        })
        .catch(error => {
            console.log("reload not complete")
            console.error("Error:", error);
            document.getElementById("p").innerText = error;
            document.getElementById("getbutton").textContent = "Error";
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
            JSON.parse(data);
            resolve(true);
            if(options != undefined && options.cell != undefined)options.cell.textContent = "完了";
            if(type == "post")localStorage.removeItem("element_post");
            if(type == "modify")localStorage.removeItem("element_modify");
            if(type == "delete")localStorage.removeItem("element_delete");
            if(options != undefined && options.get_required == true){
                cellPendingAnimation(document.getElementById("getbutton"), "getbutton");
                get_events().then((data)=>{
                    display(data, true);//saveCalendarEventsToDB(data);
                    saveCalendarEvents(data);
                    console.log("post events 完了")
                });
            }
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
    let datas = [{
        'id': event_data.id
    }];
    postEvents("delete", datas);
    let new_date = new Date(date);
    console.log("old_date", new_date);
    if(color == 4)new_date.setDate(todayDate.getDate()+1);
    if(color == 1)new_date.setDate(date.getDate()+7);
    if(color == 9)new_date.setMonth(date.getMonth()+1);
    console.log("new_date", new_date);
    datas = [{
        'title': event_data.title,
        'date_start': new_date,
        'date_end': new_date,
        'color': color,
    }];
    if(datas[0].title != ""){
        document.getElementById("postbutton").textContent = "……";
        postEvents("post", datas, {get_required: false}).then((data) => {
            if(data)document.getElementById("postbutton").textContent = "完了";
            else document.getElementById("postbutton").textContent = "Error";
        });
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
    let studyhistory = createE("div", {"innerText": Math.floor(studytime/3600)+":"+Math.floor((studytime/60)%60).toString().padStart(2, 0)+","+(studytime%60).toString().padStart(2, 0)}, 
    {"gridRow": row, "gridColumn": 2});
    let hobbyhistory = createE("div", {"innerText": Math.floor(hobbytime/3600)+":"+Math.floor((hobbytime/60)%60).toString().padStart(2, 0)+","+(hobbytime%60).toString().padStart(2, 0)},
    {"gridRow": row, "gridColumn": 3});
    document.getElementsByClassName('grid')[0].appendChild(hobbyhistory);
    document.getElementsByClassName('grid')[0].appendChild(studyhistory);
}
export function reload(event, button){
    if(event != undefined){ //ボタンを押して更新する場合
        let date_start = new Date(Date.parse(event.target.start.value));
        let date_end = new Date(Date.parse(event.target.end.value));
        get_events(date_start, date_end).then((data)=>{
            display(data, true);//saveCalendarEventsToDB(data);
            console.log("更新 完了");
            saveCalendarEvents(data);
        });
    } else get_events().then((data)=>{display(data, true); console.log("更新 完了"); saveCalendarEvents(data);}); //最初に更新する場合
    cellPendingAnimation(button, "getbutton");
    
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
        // button.innerText="更新";
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
    if(document.getElementById("cell"))document.getElementById("cell").remove();
    let cell = createE("div", {"className": "small_container", "id": "cell"});
    let date_start = new Date(Date.parse(document.getElementById("reload_form").start.value));
    let date_end = new Date(Date.parse(document.getElementById("reload_form").end.value));
    date_start.setDate(date_start.getDate()-(date_start.getDay()+5)%7-1);
    date_end.setDate(date_end.getDate()+(7-date_end.getDay())%7);
    let display_none_cells = new Array((date_end-date_start)/86400000);
    let timelines = new Array((date_end-date_start)/86400000);
    console.log("display start")
    for(let date_monday = new Date(date_start), i = 0; date_monday <= date_end; date_monday.setDate(date_monday.getDate()+7), i++){
        let week_cell = createE("div", {"className": "week_cell"});
        // let time_index = createE("div", "time_index");
        // for(let j = 0; j < 8; j++){
        //     let memori = createE("div", "div");
        //     memori.style.width = "100%";
        //     memori.style.borderBottom = "solid black 1px";
        //     time_index.appendChild(memori)
        // }
        // week_cell.appendChild(time_index);
        let date = new Date(date_monday);
        for(let j = 0; j < 7; j++){
            // let date_start = new Date(events[i].date_start);
            // let date_end = new Date(events[i].date_end);
            let day_cell = createE("div", {"className": "day_cell"});
            let date_index_cell = createE("div", {"className": "date_index_cell", "innerText": date.getMonth()+1+"/"+date.getDate()+"("+days[j]+")"});
            if ((date.getDay()+6)%7 == 6)date_index_cell.style.color = "orangered";
            else if ((date.getDay()+6)%7 == 5)date_index_cell.style.color = "darkturquoise";
            let day_div = createE("div", {"className": "div"});
            let display_none_cell = createE("div", {"className": "display_none_cell"});
            let timeline = createE("div", {"className": "timeline"});
            day_cell.appendChild(date_index_cell);
            day_cell.appendChild(timeline);
            display_none_cell.appendChild(day_cell);
            day_div.appendChild(display_none_cell);
            week_cell.appendChild(day_div);
            display_none_cells[7*i+j] = display_none_cell;
            timelines[7*i+j] = timeline;
            for(let k= 0; k<5; k++){
                let line = createE("div", {"className": "display_none_cell line"}, {"gridRow": 3*(k+1)+1});
                timeline.appendChild(line);
            }
            date.setDate(date.getDate()+1);
        }
        cell.appendChild(week_cell);
    }
    let skip = 0;
    let duplicate_same_hour = 0;
    let duplicate_over_day = 0;
    let mondayStartDate = new Date(Date.parse(document.getElementById("reload_form").start.value));
    mondayStartDate.setDate(mondayStartDate.getDate()-(mondayStartDate.getDay()+5)%7-1);
    mondayStartDate.setHours(0);
    let startHour;
    let eventStartDate = new Date(date_start);
    let oldStartDate;
    let oldStartHour;
    let date_end_long = new Array(5);
    let event_container_containers = new Array((date_end-date_start)/86400000*18);
    let event_container_details = new Array((date_end-date_start)/86400000*18);
    for(let i = 0; i < events.length; i++){
        if(events[i].color != 3){
            // console.log(events[i].date_start)
            eventStartDate = new Date(events[i].date_start);
            let date_end = new Date(events[i].date_end);
            let date_cell = createE("input", {"type": "text", "className": "date_cell", "value": eventStartDate.getHours().toString() + ":" + eventStartDate.getMinutes().toString().padStart(2, "0")});
            let event_cell = createE("input", {"type": "text", "className": "event_cell display_land_none_cell", "value": events[i].title});
            let event_cell2 = createE("div", {"className": "event_cell display_none_cell", "innerText": events[i].title});
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
            let color = colorCodes[events[i].color];
            if(color == undefined)color = "#404040";
            if(events[i].color == 4 || events[i].color == 1 || events[i].color == 9){
                event_cell.style.width = "56%";
                mark_cell.value = "◆";
                mark_cell.style.visibility = "visible";
                mark_cell.style.width = "4%";
                mark_cell.style.color = color;
                event_cell2.innerHTML = "<span style='color:"+color+"'>◆ </span>"+event_cell2.innerHTML;
                // console.log((eventStartDate - todayDate)/3600000);
                if(task_renew_required){
                    if(events[i].color == 4 && eventStartDate - todayDate < 86400000){ // 現在日程の一日後より前の時刻の場合に
                        renewTask(events[i], eventStartDate, 4);
                    }
                    if(events[i].color == 1 && eventStartDate - todayDate < 172800000){ // 現在日程の2日後より前の時刻の場合に
                        renewTask(events[i], eventStartDate, 1);
                    }
                    if(events[i].color == 9 && eventStartDate - todayDate < 604800000){ // 現在日程の１週間後より前の時刻の場合に
                        renewTask(events[i], eventStartDate, 9);
                    }
                }
            }
            else {event_cell.style.color = color;event_cell2.style.color = color;}

            for(let element of [date_cell, event_cell]){
                element.addEventListener("change", (event) =>{
                    event.target.style.backgroundColor = "#fff0f0";
                    let element_data = {
                        "id": events[i].id
                    }
                    let key;
                    if(event.target.className == "date_cell"){
                        key = "date";
                    }
                    if(event.target.className.includes("event_cell"))key = "title";
                    if(event.target.className.includes("mark_cell"))key = "mark";
                    element_data[key] = event.target.value;
                    pushLocalStorage("element_modify", element_data);
                })
            }
            event_container.appendChild(date_cell);
            event_container.appendChild(mark_cell);
            event_container.appendChild(event_cell);
            event_container2.appendChild(event_cell2);
            let delete_cell = createE("button", {"className": "delete_cell", "innerText": "削除"});
            let modify_cell = createE("button", {"className": "delete_cell", "innerText": "変更"});
            delete_cell.addEventListener('click', () => {
                var result = confirm("本当に\""+events[i].title+"\"を削除しますか？");
                if(result){
                    const element_data = {'id': events[i].id};
                    pushLocalStorage("element_delete", element_data);
                }
            });
            // modify_cell.addEventListener('click', () => {
            //     // 日付の区切り：-, /　時間の区切り：:　日付と時間の区切り：/,  , T
            //     let new_date = event_container.querySelector(".date_cell").value.split(/~|～|\n/, 2); // 開始と終了で分割
            //     if(new_date[1] == undefined)new_date[1] = new_date[0]; // 終了が無い場合は開始と同じとみなす
            //     for(let i = 0; i < 2; i++){
            //         let buffer = new_date[i].split(/年|月/).map((p) => p.padStart(2, '0')).join("-"); // 日付部分をYYYY-MM-DD形式に変換
            //         buffer = buffer.split(/時|分/).map((p) => p.padStart(2, '0')).join(":"); // 時間部分をhh:mm形式に変換
            //         if(!buffer.match(/\d{4}/)){ // 年が無い場合は今年とみなす
            //             if(!buffer.match(/\d{2}[/-月]\d{2}/)){ // 月日が無い場合は今日とみなす
            //                 buffer = (todayDate.getMonth()+1)+ "/" + todayDate.getDate()+ " " + buffer;
            //             }
            //             buffer = todayDate.getFullYear()+ "/" + buffer;
            //         }
            //         new_date[i] = buffer.split(/T|\.|日/).join(" "); // 日付と時間で分割
            //     }
            //     console.log(new_date)
            //     let new_event_data = {
            //         "id": events[i].id,
            //         "title": event_container.querySelector(".event_cell").value,
            //         "date_start": new Date(new_date[0]),
            //         "date_end": new Date(new_date[1]),
            //         "color": event_container.querySelector(".mark_cell").value
            //     }
            //     console.log(new_event_data)
            //     cellPendingAnimation(modify_cell)
            //     modifyEvent(new_event_data, modify_cell)
            // });
            event_container.appendChild(delete_cell);
            event_container.appendChild(modify_cell);
            let date_start_0 = new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate());
            // console.log(eventStartDate,mondayStartDate);
            // console.log((date_start_0-mondayStartDate)/86400000);
            // event_container.style.top = (eventStartDate.getHours()/24*350+30)+"px";
            startHour = Math.min(Math.max(eventStartDate.getHours()-5, 1), 20);
            let endHour= Math.min(Math.max(date_end.getHours()-5, startHour+1), 20);

            // イベントの時刻の重複回数を調べる処理
            if(i){
                // console.log(eventStartDate.getDate() , oldStartDate.getDate(), startHour , oldStartHour)
                if(eventStartDate.getDate() == oldStartDate.getDate() && startHour == oldStartHour)duplicate_same_hour += 1;
                else duplicate_same_hour = 0;
                if(duplicate_over_day && date_end_long[duplicate_over_day-1] < eventStartDate){
                    // console.log(date_end_long[duplicate_over_day-1])
                    duplicate_over_day -= 1;
                }
                console.log(duplicate_same_hour,duplicate_over_day)
            }

            let duplicate = duplicate_same_hour + duplicate_over_day + 1;
            let i_hour = Math.max((date_start_0-mondayStartDate)/86400000, 0)*18+Math.min(Math.max(eventStartDate.getHours()-5, 1), 20);
            if(date_start_0 < mondayStartDate)i_hour = 0;

            // イベントの配置
            if(event_container_containers[i_hour] != undefined){
                // すでに同じ時間帯にイベントがある場合
                if(event_container_containers[i_hour].style.gridRowEnd < endHour)event_container_containers[i_hour].style.gridRowEnd = endHour;
                event_container.style.gridColumn = duplicate+"/6";
                event_container_containers[i_hour].appendChild(event_container);
                // 重複時の折りたたみ処理
                if(event_container_details[i_hour] == undefined){
                    let event_container_detail = createE("details", {"className": "event_grid display_none_cell"});
                    event_container_detail.appendChild(createE("summary", {"innerText": ""}));
                    event_container_containers[i_hour].querySelectorAll(".event_container")[1].querySelector(".event_cell").style.backgroundColor = "white";
                    event_container_detail.appendChild(event_container_containers[i_hour].querySelectorAll(".event_container")[1]);
                    event_container_containers[i_hour].appendChild(event_container_detail);
                    event_container_details[i_hour] = event_container_detail;
                }
                event_container2.querySelector(".event_cell").style.backgroundColor = "white";
                event_container_details[i_hour].appendChild(event_container2);
                event_container_details[i_hour].querySelector("summary").innerText = duplicate_same_hour+1;
            } else {
                // 初めての時間帯のイベントの場合
                let number = (date_start_0-mondayStartDate)/86400000;
                let options = {"startHour": startHour, "endHour": endHour, "start_column": duplicate, "i": i, "timelines": timelines, "number": number, "wide": true};
                let event_container_container = createE("div", {"className": "event_grid"}, {"backgroundColor": "hsla("+options.i*159+", 100%, 50%, 0.05)", "border": "solid 0.1px hsla("+options.i*159+", 100%, 0%, 0.2)", "gridRow": startHour+"/"+endHour});
                // if(date_start_0 < mondayStartDate)event_container_container.style.gridRow = "1/2";
                event_container.style.gridColumn = duplicate+"/6";
                event_container_container.appendChild(event_container);
                event_container_container.appendChild(event_container2);
                event_container_containers[i_hour] = event_container_container;
                let timeline = timelines[Math.max((date_start_0-mondayStartDate)/86400000, 0)];
                timeline.insertBefore(event_container_container, timeline.firstChild);
                
                // イベントの背景を作成する処理
                /*
                if(eventStartDate.getDate() == date_end.getDate()){
                    createEventBackground(options, event_container);
                } else {
                    date_end_long[duplicate_over_day] = date_end;
                    duplicate_over_day += 1;
                    if(number >= 0){
                        options.endHour = startHour+1; options.start_column = duplicate+1;
                        createEventBackground(options);
                        options.endHour = 19; options.start_column = duplicate; options.wide = false;
                        createEventBackground(options);
                    }else {
                        options.startHour = 1; options.endHour = 2;
                        options.start_column = duplicate+1; options.number = 0;
                        createEventBackground(options);
                    }
                    let days = Math.floor((date_end - date_start_0)/86400000);
                    let j = 1
                    options.startHour = 1; options.endHour = 19;
                    options.start_column = duplicate; options.number = number + j; options.wide = true;
                    for(; j < days; j++){
                        if(number+j >= 0)createEventBackground(options);
                    }
                    options.endHour = endHour;
                    createEventBackground(options);
                }*/
            }
            display_none_cells[Math.max((date_start_0-mondayStartDate)/86400000, 0)].style.display = "flex";
            skip = 0;
        }else skip++;
        oldStartDate = eventStartDate;
        oldStartHour = startHour;
    }
    // console.log("cell classname",cell.style.className);
    document.getElementsByClassName("container")[0].appendChild(cell);
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

export function pushLocalStorage(key, data){
    let datas = JSON.parse(localStorage.getItem(key));
    if(datas)datas.push(data);
    else datas = [data];
    localStorage[key] = JSON.stringify(datas);
}