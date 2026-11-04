const date = new Date();

export function date_string(date, separator, options){
    let date_buffer = new Date(date);
    let date_string = "";
    if(options.month_offset != undefined)date_buffer.setMonth(date.getMonth() + options.month_offset);
    if(options.required.includes("year"))date_string += date_buffer.getFullYear().toString();
    date_string += separator + (date_buffer.getMonth() + 1).toString().padStart(2, "0")
    date_string += separator + date_buffer.getDate().toString().padStart(2, "0")
    if(options.required.includes("hour") && separator == "-")date_string += "T" + date_buffer.getHours().toString().padStart(2, "0") + ":" + date_buffer.getMinutes().toString().padStart(2, "0");;
    if(options.required.includes("hour") && separator == "/")date_string += " " + date_buffer.getHours().toString() + ":" + date_buffer.getMinutes().toString().padStart(2, "0");
    return date_string;
}

export function str2date(date_string, defaultDate){
    /*
        Date()で日付と認識されるパターンは以下の三つ．
        スペースとスラッシュはいくら重ねてもいい．ハイフンとTは単体で使う．
        yyyy[[ /]+-]mm[[ /]+-]+dd[ /]+hh:mm　dateの区切りは( ,/,-)，日と時の区切りは( ,/)，timeの区切りは:のみ
        yyyy[[ /]+]mm[[ /]+]+dd-hh:mm　dateの区切りは( ,/)，日と時の区切りは(-)，timeの区切りは:のみ
        yyyy-mm-ddThh:mm　date，日と時，timeの区切りは-，T，:
    */
    let buffer = date_string.split(/[T]/);
    console.log("first", buffer)
    // if(!buffer[0].match(/[-/年月]/))buffer = ["", buffer[0]];
    // else if(!buffer[1])buffer = [buffer[0], ""];

    buffer[0] = buffer[0].split(/[ /年月]/).map((p) => p = p.padStart(2, '0')).join("-"); // 日付部分をYYYY-MM-DD形式に変換
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
    buffer[1] = buffer[1].split(/[ :時分]/).map((p) => p = p.padStart(2, '0')).join(":"); // 時間部分をhh:mm形式に変換
    console.log(buffer[1])
    if(!buffer[1].match(/^\d{2}:\d{2}/)){ // 時、分が無い場合
        if(buffer[1].match(/^\d{2}/)){ // 分が有る場合は:00を付け足す
            buffer[1] += ":00";
        } else buffer[1] = "00:00";
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


const usageData = [
    {
    date: "2026-10-08T09:00:00",
    duration: "100s",
    category: "game"
    },
    {
    date: "2026-10-08T10:00:00",
    duration: "150s",
    category: "tv"
    },
    {
    date: "2026-10-08T11:00:00",
    duration: "200s",
    category: "game"
    },
    {
    date: "2026-10-08T13:00:00",
    duration: "300s",
    category: "study"
    },
    {
    date: "2026-10-09T09:00:00",
    duration: "500s",
    category: "game"
    }
];


// ============================================
// durationを秒に変換
// ============================================

function durationToSeconds(duration) {
    const match = String(duration).match(
    /^(\d+(?:\.\d+)?)\s*(s|m|h)$/
    );

    if (!match) {
    return 0;
    }

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
    case "s":
        return value;

    case "m":
        return value * 60;

    case "h":
        return value * 60 * 60;

    default:
        return 0;
    }
}


// ============================================
// 秒を見やすい形式に変換
// ============================================

function formatDuration(seconds) {
    seconds = Math.round(seconds);

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const result = [];

    if (hours > 0) {
    result.push(`${hours}時間`);
    }

    if (minutes > 0) {
    result.push(`${minutes}分`);
    }

    if (secs > 0 || result.length === 0) {
    result.push(`${secs}秒`);
    }

    return result.join(" ");
}


// ============================================
// カテゴリー一覧を生成
// ============================================

const categorySelect = document.getElementById("category");

const categories = [
    ...new Set(usageData.map(item => item.category))
];

categories.forEach(category => {
    const option = document.createElement("option");

    option.value = category;
    option.textContent = category;

    categorySelect.appendChild(option);
});


// ============================================
// Chart.js
// ============================================

const ctx = document
    .getElementById("usageChart")
    .getContext("2d");

let usageChart = null;


// ============================================
// データをフィルタリング
// ============================================

function getFilteredData() {

    const selectedCategory =
    document.getElementById("category").value;

    const startDate =
    document.getElementById("startDate").value;

    const endDate =
    document.getElementById("endDate").value;

    return usageData.filter(item => {

    // カテゴリー
    if (
        selectedCategory !== "all" &&
        item.category !== selectedCategory
    ) {
        return false;
    }

    const date = new Date(item.date);

    // 開始日
    if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);

        if (date < start) {
        return false;
        }
    }

    // 終了日
    if (endDate) {
        const end = new Date(`${endDate}T23:59:59`);

        if (date > end) {
        return false;
        }
    }

    return true;
    });
}


// ============================================
// グラフ更新
// ============================================

function updateChart() {
    // 関数の説明
    

    const filteredData = getFilteredData();

    // -----------------------------
    // 合計時間
    // -----------------------------

    const totalSeconds = filteredData.reduce(
    (total, item) =>
        total + durationToSeconds(item.duration),
    0
    );

    document.getElementById("totalTime").textContent =
    formatDuration(totalSeconds);


    // -----------------------------
    // 日付ごとに集計
    // -----------------------------

    const dailyUsage = {};

    filteredData.forEach(item => {

    const date = item.date.substring(0, 10);

    if (!dailyUsage[date]) {
        dailyUsage[date] = 0;
    }

    dailyUsage[date] +=
        durationToSeconds(item.duration);
    });


    const labels = Object.keys(dailyUsage).sort();

    const values = labels.map(
    date => dailyUsage[date]
    );


    // -----------------------------
    // 既存グラフを削除
    // -----------------------------

    if (usageChart) {
    usageChart.destroy();
    }


    // -----------------------------
    // グラフ作成
    // -----------------------------

    usageChart = new Chart(ctx, {

    type: "bar",

    data: {
        labels: labels,

        datasets: [
        {
            label: "使用時間",

            data: values,

            borderWidth: 1
        }
        ]
    },

    options: {

        responsive: true,

        scales: {
        y: {
            beginAtZero: true,

            title: {
            display: true,
            text: "使用時間（秒）"
            }
        },

        x: {
            title: {
            display: true,
            text: "日付"
            }
        }
        },

        plugins: {
        tooltip: {
            callbacks: {
            label: function(context) {
                return formatDuration(context.raw);
            }
            }
        }
        }
    }
    });
}


// ============================================
// フィルター変更時
// ============================================

document
    .getElementById("category")
    .addEventListener("change", updateChart);

document
    .getElementById("startDate")
    .addEventListener("change", updateChart);

document
    .getElementById("endDate")
    .addEventListener("change", updateChart);


// 初期表示
updateChart();
