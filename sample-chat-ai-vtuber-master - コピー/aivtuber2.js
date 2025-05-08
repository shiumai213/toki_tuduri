
// TODO: VOICEVOXのURL (デフォルトの設定の場合は変える必要なし)
const VOICE_VOX_API_URL = "http://localhost:50021";


// QUEUEに積まれたコメントを捌くインターバル (ms)
const INTERVAL_MILL_SECONDS_HANDLING_COMMENTS = 3000;

// VOICEVOXのSpeakerID
const VOICEVOX_SPEAKER_ID = '14';

var audio = new Audio();
// 処理するコメントのキュー
var liveCommentQueues = [];
// 回答済みのコメントの配列
var responsedLiveComments = [];
// VTuberが応答を考え中であるかどうか
var isThinking = false;
// ライブごとに設定する識別子
var LIVE_OWNER_ID = createUuid();
// NGワードの配列
var ngwords = []
// YouTube LIVEのコメント取得のページング
var nextPageToken = "";
// コメントの取得が開始されているかどうかのフラグ
var isLiveCommentsRetrieveStarted = true;


const startTyping = (param) => {
    let el = document.querySelector(param.el);
    el.textContent = "";
    let speed = param.speed;
    let string = param.string.split("");
    string.forEach((char, index) => {
        setTimeout(() => {
            el.textContent += char;
        }, speed * index);
    });
};


// OpenAI GPT-3.5用の関数
async function getOpenAIResponse(utterance, username) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer koko"
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "あなたは親切な会話AIです。" },
                { role: "user", content: utterance }
            ],
            temperature: 0.7
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}


const playVoice = async (inputText) => {
    audio.pause();
    audio.currentTime = 0;
    const ttsQuery = await fetch(VOICE_VOX_API_URL + '/audio_query?speaker=' + VOICEVOX_SPEAKER_ID + '&text=' + encodeURI(inputText), {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    if (!ttsQuery) return;
    const queryJson = await ttsQuery.json();
    const response = await fetch(VOICE_VOX_API_URL + '/synthesis?speaker=' + VOICEVOX_SPEAKER_ID + '&speedScale=2', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryJson)
    })
    if (!response) return;
    const blob = await response.blob();
    const audioSourceURL = window.URL || window.webkitURL
    audio = new Audio(audioSourceURL.createObjectURL(blob));
    audio.onended = function () {
        setTimeout(handleNewLiveCommentIfNeeded, 1000);
    }
    audio.play();
}

const visibleAIResponse = () => {
    let target = document.getElementById('aiResponse');
    target.style.display = ""
}

const invisibleAIResponse = () => {
    let target = document.getElementById('aiResponse');
    target.style.display = "none"
}

const handleLiveComment = async (comment, username) => {
    isThinking = true;
    visibleAIResponse();
    startTyping({
        el: "#aiResponseUtterance",
        string: "Thinking................",
        speed: 50
    });
    let userCommentElement = document.querySelector("#userComment");
    userCommentElement.textContent = username + ":　" + comment;
    const response = await getOpenAIResponse(comment, username);
    isThinking = false;
    if (username == "") {
        await playVoice(response, true, response, false);
    } else {
        await playVoice(username + "、" + response, true, response, false);
    }
    startTyping({
        el: "#aiResponseUtterance",
        string: response,
        speed: 50
    });
}


const getNextComment = () => {
    let nextComment = ""
    let nextRaw = ""
    for (let index in liveCommentQueues) {
        if (!responsedLiveComments.includes(liveCommentQueues[index])) {
            const arr = liveCommentQueues[index].split(":::")
            if (arr.length > 1) {
                nextComment = arr[0] + "さんから、「" + arr[1] + "」というコメントが届いているよ。"
                nextRaw = arr[1]
                break;
            }
        }
    }
    return [nextComment, nextRaw];
}

const handleNewLiveCommentIfNeeded = async () => {
    if (liveCommentQueues.length == 0) {
        // QUEUEがなければ何もしない
        setTimeout(handleNewLiveCommentIfNeeded, INTERVAL_MILL_SECONDS_HANDLING_COMMENTS);
        return;
    }

    if (isThinking) {
        // VTuberが応答を考えているときは新規コメントを捌かない
        setTimeout(handleNewLiveCommentIfNeeded, INTERVAL_MILL_SECONDS_HANDLING_COMMENTS);
        return;
    }

    if (!audio.ended) {
        // VTuberが声を発しているときは新規コメントを捌かない
        setTimeout(handleNewLiveCommentIfNeeded, INTERVAL_MILL_SECONDS_HANDLING_COMMENTS);
        return;
    }

    for (let index in liveCommentQueues) {
        if (!responsedLiveComments.includes(liveCommentQueues[index])) {
            const arr = liveCommentQueues[index].split(":::")
            if (arr.length > 1) {
                responsedLiveComments.push(liveCommentQueues[index]);
                isThinking = true;
                await handleLiveComment(arr[1], arr[0]);
                break;
            }
        }
    }
    setTimeout(handleNewLiveCommentIfNeeded, 5000);
}

const onClickSend = () => {
    let utterance = document.querySelector("#utterance");
    handleLiveComment(utterance.value, 'ユーザーさん');
    utterance.value = "";
}



const img = ["chara.png", "chara_blinking.png"];
var isBlinking = false;

function blink() {
    if (isBlinking) {
        isBlinking = false;
        document.getElementById("charaImg").src = img[1];
        setTimeout(blink, 100);
    } else {
        isBlinking = true;
        document.getElementById("charaImg").src = img[0];
        setTimeout(blink, 3500);
    }
}

function createUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (a) {
        let r = (new Date().getTime() + Math.random() * 16) % 16 | 0, v = a == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}