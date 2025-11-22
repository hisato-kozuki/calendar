import { createE, date_string, str2date, button_display, pushLocalStorage } from "./function.js";

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
    modifyEvent(event_data){
        for(let week of this.weeks){
            for(let day of week.days)day.modifyEvent(event_data);
        }
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
    modifyEvent(event_data){
        for(let container of this.containers){
            if(container)for(let event of container.events){
                if(event && event.id == event_data.id)event.modifyEvent(event_data);
            }
        }
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
        let date_cell = createE("input", {"type": "text", "className": "date_cell"});
        let event_cell = createE("input", {"type": "text", "className": "event_cell display_land_none_cell"});
        let event_cell2 = createE("div", {"className": "event_cell display_none_cell"});
        let mark_cell = createE("div", {"className": "mark_cell display_land_none_cell"});
        let event_container = createE("div", {"className": "event_container"});
        let event_container2 = createE("div", {"className": "event_container"});
        
        event_container.appendChild(date_cell);
        event_container.appendChild(mark_cell);
        event_container.appendChild(event_cell);

        this.set(event_container, event_data);

        let color = colorCodes[event_data.color];
        if(event_data.color == 4 || event_data.color == 1 || event_data.color == 9)event_cell2.innerHTML = "<span style='color:"+color+"'>◆ </span>"+event_data.title;
        else {event_cell2.innerHTML = event_data.title;event_cell2.style.color = color;}

        if(delete_id != undefined){
            date_cell.style.backgroundColor = "transparent";
            event_cell.style.backgroundColor = "transparent";
            mark_cell.style.backgroundColor = "transparent";
            event_container.style.backgroundColor = "#A0FFA0";
        }

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

        for(let container of [event_container, event_container2]){
            container.addEventListener("dblclick", (event) => {
                button_display(document.getElementById("register_display_button"), 'register_console');
                let form = document.getElementById("register_form");
                form.id.value = event_data.id;
                form.title.value = event_data.title;
                form.start.value = date_string(eventStartDate, "/", {"required":["year","hour"]});
                form.end.value = date_string(date_end, "/", {"required":["year","hour"]});
                form.color.value = event_data.color;
                document.getElementById("colorcircle").style.backgroundColor = color;
                document.getElementById("postbutton").textContent = "変更";
            })
        }

        this.id = event_data.id;
        this.container1 = event_container;
        this.container2 = event_container2;
        this.mousedown_position = false;

        event_container.appendChild(delete_cell);
        event_container2.appendChild(event_cell2);
    }
    set(event_container, event_data){
        let date_cell = event_container.querySelector(".date_cell");
        let event_cell = event_container.querySelector(".event_cell");
        let mark_cell = event_container.querySelector(".mark_cell");
        let date_start = new Date(event_data.date_start);
        let date_end = new Date(event_data.date_end);
        date_cell.value = date_start.getHours().toString() + ":" + date_start.getMinutes().toString().padStart(2, "0");
        event_cell.value = event_data.title;
        if(date_start.getFullYear() != date_end.getFullYear()){
            date_cell.value += "\n～" + date_string(date_end, "/", {"required": ["year", "hour"]});
        }else if(date_start.getMonth() != date_end.getMonth() || date_start.getDate() != date_end.getDate()){
            date_cell.value += "\n～" + date_string(date_end, "/", {"required": ["hour"]});
        }else if(date_start.getHours() != date_end.getHours()){
            date_cell.value += "～" + date_end.getHours().toString().padStart(2, "0") + ":" + date_end.getMinutes().toString().padStart(2, "0");
        }

        let color = colorCodes[event_data.color];
        if(color == undefined)color = "#039BE5";
        if(event_data.color == 4 || event_data.color == 1 || event_data.color == 9){
            event_cell.style.width = "61%";
            mark_cell.innerHTML = "<p>◆</p>";
            mark_cell.style.visibility = "visible";
            mark_cell.style.width = "4%";
            mark_cell.style.color = color;
        }
        else {event_cell.style.color = color;}
    }
    modifyEvent(event_data){
        this.set(this.container1, event_data);
        let event_cell2 = this.container2.querySelector(".event_cell");
        let color = colorCodes[event_data.color];
        if(event_data.color == 4 || event_data.color == 1 || event_data.color == 9)event_cell2.innerHTML = "<span style='color:"+color+"'>◆ </span>"+event_data.title;
        else {event_cell2.innerHTML = event_data.title;event_cell2.style.color = color;}
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

class ColorCircle{
    constructor(div, select){
        select.value = 0;
        this.opened_count = 0;
        this.state = "closed"
        this.dots = [];
        let index = [0, 8, 7, 11, 4, 1, 9, 3, 5, 2, 6, 10];
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

new ColorCircle(document.getElementById("colorcircle"), document.getElementById("register_form").color)