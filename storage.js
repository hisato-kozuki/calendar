import { Calendar } from "./class.js";

class appStorage{
    constructor(){
        console.log("constructor appStorage")
        this.storage = localStorage;
    }
    loadStorage(storage_data){
        if(storage_data){
            if(this.calendar)this.calendar.update(storage_data.calendar);
            this.post = storage_data.post;
            this.modify = storage_data.modify;
            this.delete = storage_data.delete;
            this.study_time = storage_data.study_time;
            this.hobby_time = storage_data.hobby_time;
        }
    }
    saveStorage(){
        let event_datas = [];
        let i = 0;
        for(let event_storage of [this.post, this.modify, this.delete]){
            event_datas[i] = []
            for(let event of event_storage)event_datas[i].push(event.event_data);
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

function migrate(saved_data){
    if(saved_data.calendar === undefined){
        saved_data.calendar = {
            date_start: new Date(), // 
            date_end: new Date(), // 
            events: [] // イベントの配列
        }
    }
    if(saved_data.post === undefined)saved_data.post = {};
    if(saved_data.modify === undefined)saved_data.modify = {};
    if(saved_data.delete === undefined)saved_data.delete = {};
}

let storage = new appStorage();

export function loadStorage(){
    let saved_data = JSON.parse(localStorage["calendar-app"] || "{}");
    migrate(saved_data)
    storage.calendar = new Calendar(document.getElementsByClassName("container")[0]);
    storage.loadStorage(saved_data)
}

export function getStorage(){
    return storage;
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

export function pushEventStorage(key, event){ // 追加・変更・削除したイベントをappStorageに追加・更新する関数
    /*
    event: Eventクラスのインスタンス
    */
    let stored_datas = storage[key];
    if(stored_datas){
        stored_datas[event.id] = event;
    }
    else storage[key] = {[event.id]: event};
}

export function deleteEventStorage(key, event){ // ローカルストレージのデータを削除する関数
    let stored_datas = storage[key];
    if(stored_datas){
        delete stored_datas[event.id]; // オブジェクトから削除
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
    storage.pushed_events = datas;
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
