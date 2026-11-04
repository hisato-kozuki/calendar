import { createE } from "./function_basic.js";
import { saveStorage, viewCalendar, resetEditedEvent, getGasEventList } from "./storage.js";
const colorCodes = [0, "#7986CB","#33B679","#8E24AA","#E67C73","#F6BF26","#F4511E","#039BE5","#616161","#3F51B5","#0B8043","#D50000"];

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
            viewCalendar();
            saveStorage();
            this.counter.textContent = 0;
        })
    }
    set(number){this.counter.textContent = number}
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