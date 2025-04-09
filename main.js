const url = "https://script.google.com/macros/s/AKfycbwFBOS6OwaSKlKf1Uui1BF6_CY1cw25TPRApnUwltMnxoDuJfCv7hRbWoshXSPXPo4oRA/exec"; // GASで取得したウェブアプリのURL
const date = new Date();

let year_end=year_start=date.getFullYear(), month_start=date.getMonth(), day_end=day_start=date.getDate(), month_end=month_start+2;

let events;
const data = {
    'date_start': [year_start, month_start, day_start],
    'date_end': [year_end, month_end, day_end]
};
const options = {
    'method' : 'post',
    'headers': {
        'Content-Type': "application/x-www-form-urlencoded",
    },
    'body' : JSON.stringify(data) //送りたいデータをpayloadに配置してJSON形式変換。
};
function get_events(){
    //res = UrlFetchApp.fetch(url,options); // <- Post リクエスト
    fetch(url, options)
    .then(response => response.text())
    .then(data => {console.log(data);console.log(events=JSON.parse(data));display(events);})
    .catch(error => console.error("Error:", error));
}

function display(events){
    let text="";
    for(let i = 0; i < events.length; i++){
        console.log(text)
        text += events[i].year + "年" + (events[i].month+1).toString().padStart(2, "0") + "月" + events[i].date.toString().padStart(2, "0") + "日" + events[i].hour.toString().padStart(2, "0") + "時　" + events[i].title + "\n";
    }
    document.getElementById("p").innerText = text;
}
document.getElementById("form").addEventListener('submit', event => {
    // イベントを停止する
    event.preventDefault();
    const data = {
        'title': document.getElementById("form").title,
        'y': document.getElementById("form").y,
        'm': document.getElementById("form").m,
        'd': document.getElementById("form").d,
        'h_s': document.getElementById("form").h_s,
        'h_s': document.getElementById("form").h_e,
    };
    const options = {
        'method' : 'post',
        'headers': {
            'Content-Type': "application/x-www-form-urlencoded",
        },
        'body' : JSON.stringify(data) //送りたいデータをpayloadに配置してJSON形式変換。
    };
    fetch(url, options)
    .then(response => response.text())
    .then(data => {console.log(data);console.log(events=JSON.parse(data));display(events);})
    .catch(error => console.error("Error:", error));
    // なんかの処理
  
    // 改めてsubmitする
    //form.submit();
  });
window.onload = function(){
    get_events();
}
