// VOICEVOX APIのURL（通常はローカル）
const VOICE_VOX_API_URL = "http://localhost:50021";
// VOICEVOXの話者ID（例：14 = 四国めたん）
const VOICEVOX_SPEAKER_ID = '14';

var audio = new Audio();

// AIの返答表示用エレメント
const visibleAIResponse = () => {
    document.getElementById('aiResponse').style.display = "";
}
const invisibleAIResponse = () => {
    document.getElementById('aiResponse').style.display = "none";
}

// タイピングアニメーション
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

// OpenAIとの通信（GPT-3.5）
async function getOpenAIResponse(utterance, username) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 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"
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "あなたは日記を書くのを手伝う優しいAIアシスタントです。ユーザーが今日の出来事や気持ちを話してくれたら、優しく相づちを打ちながら、日記の文章になるようにサポートしてください。話し方は丁寧で親しみやすく、リラックスした雰囲気にしてください。"
                },
                { role: "user", content: utterance }
            ],
            temperature: 0.7
        })
    });

    const data = await response.json();
    return data.choices[0].message.content;
}

// VOICEVOXで音声合成・再生
const playVoice = async (inputText) => {
    audio.pause();
    audio.currentTime = 0;

    const ttsQuery = await fetch(
        `${VOICE_VOX_API_URL}/audio_query?speaker=${VOICEVOX_SPEAKER_ID}&text=${encodeURI(inputText)}`,
        { method: 'POST' }
    );
    const queryJson = await ttsQuery.json();

    const response = await fetch(
        `${VOICE_VOX_API_URL}/synthesis?speaker=${VOICEVOX_SPEAKER_ID}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queryJson)
        }
    );
    const blob = await response.blob();
    const audioSourceURL = window.URL || window.webkitURL;
    audio = new Audio(audioSourceURL.createObjectURL(blob));
    audio.play();
};

// AIとの対話処理
const handleUserMessage = async (comment, username) => {
    visibleAIResponse();
    startTyping({
        el: "#aiResponseUtterance",
        string: "考え中です……",
        speed: 50
    });

    document.querySelector("#userComment").textContent = `${username}： ${comment}`;
    const response = await getOpenAIResponse(comment, username);

    await playVoice(username + "、" + response);
    startTyping({
        el: "#aiResponseUtterance",
        string: response,
        speed: 50
    });
};

// 送信ボタン押下時
const onClickSend = () => {
    let utterance = document.querySelector("#utterance");
    handleUserMessage(utterance.value, 'ユーザーさん');
    utterance.value = "";
};

// アバターのまばたき処理
const img = ["chara.png", "chara_blinking.png"];
var isBlinking = false;

function blink() {
    isBlinking = !isBlinking;
    document.getElementById("charaImg").src = isBlinking ? img[1] : img[0];
    setTimeout(blink, isBlinking ? 100 : 3500);
}

// UUID（未使用なら削除可）
function createUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (a) {
        let r = (new Date().getTime() + Math.random() * 16) % 16 | 0,
            v = a === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
