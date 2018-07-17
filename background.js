chrome.browserAction.onClicked.addListener(() => {
	//アイコンをクリックした場合
	console.log("action");
	sendExec()
		.then((result) => {
			console.log(result);
		}).catch((error) => {
			console.log(error);
			alert(error);
		});
});

async function sendExec() {
	let csrfToken = await getTypingTubeCsrfToken();
	let openUrl = await getOpenTabsUrl();
	return await sendTypingTube(csrfToken, openUrl);
}

let getOpenTabsUrl = () => {
	return new Promise((resolve, reject) => {
		chrome.tabs.getSelected(null, (tabData) => {
			resolve(tabData.url);
		});
	});
};

let getTypingTubeCsrfToken = () => {
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "GET",
			url: "https://typing-tube.net/",
			timeout: 20000,
			cache: false,
		}).done((response, status, xhr) => {
			console.log("getTypingTubeCsrfToken", status);
			if (status === "success") {
				// typing-tubeのCSRFトークンを取得 これがないとPostしても登録できない
				let csrfMeta = $(response).filter("meta[name='csrf-token']").attr("content");
				console.log("get CSRF Token: ", csrfMeta);
				resolve(csrfMeta);
			} else {
				reject("typing tube Top page access failed", response.msg);
			}
		}).fail(() => {
			reject("typing tube Top page access failed");
		});
	})
};

let sendTypingTube = (csrfToken, requestUrl) => {
	return new Promise((resolve, reject) => {
		if (!requestUrl.match(/^https?:\/\/www.youtube.com\/.+/)) {
			return reject("Not youtube Url."); // リクエスト処理強制終了
		}

		if (!csrfToken) {
			return reject("null data typing-tube CSRF Token."); // リクエスト処理強制終了
		}

		$.ajax({
			type: "POST",
			url: "https://typing-tube.net/add_request",
			// url: "https://typing-tube.net/add_request/test",
			timeout: 20000,
			cache: false,
			headers: {
				"x-csrf-token": csrfToken
			},
			 // JSON.stringifとcontentTypeを設定しないと送信後statusCode200が返って来てもparse errorになる
			data: JSON.stringify({
				"request_url": requestUrl,
				"commit": "追加リクエスト"
			}),
			contentType: 'application/json', // 
			// dataType: "json" // ここを有効にしてもpase errorでfailになる
		}).done((response, status, xhr) => {
			if (status === "success") {
				resolve("Typing tubeにリクエスト送信成功");
			} else {
				reject("send Typing tube request failed",response.msg);
			}
		}).fail((jqXHR, textStatus, errorThrown) => {
			console.log("jqXHR",jqXHR);
			console.log("textStatus",textStatus);
			reject("send Typing tube request failed");
		});
	});
};