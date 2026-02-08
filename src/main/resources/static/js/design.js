const lineCanvas = document.getElementById("line-canvas");
const lineCtx = lineCanvas.getContext("2d");
let currentLineId = null;
let penSize = 20;//ペンの太さの初期値
const penSizeSlider = document.getElementById("pen-size");
const penSizeDisplay = document.getElementById("pen-size-display");
let selectedThumb = null;//サムネイル選択


/*
 * 画面読込時、localstorageがある場合はキャンバス復元＋保存
 */
window.addEventListener("DOMContentLoaded", () => {
		//キャンバス復元
		Restoration();
		// 初期画面でもイベント付与
		attachThumbnailEvents();
		// 初期カーソルサイズと色を反映
		updateCursorCircle();

});
/*
 * キャンバス復元
 */
function Restoration(){
	const pendingImage = localStorage.getItem("pendingImageData");
	const pendingLineId = localStorage.getItem("pendingLineId");

	if (pendingImage && pendingLineId) {
		//現在の線画を元の線画で更新
		currentLineId = pendingLineId;
	    // 線画を描画
	    drawlineCanvas(currentLineId);
		
	    // 塗り絵を復元
	    const img = new Image();
	    img.src = pendingImage;
	    img.onload = () => {
	        paintCtx.drawImage(img, 0, 0, paintCanvas.width, paintCanvas.height);
	    };

	    // 復元後は削除
	    localStorage.removeItem("pendingImageData");
	    localStorage.removeItem("pendingLineId");
		// ログイン後に自動保存
		setTimeout(() => {
		    savePainting(pendingImage);
		}, 20);
	}
}
/*
 *スライダー操作でペンサイズを変更
 */
penSizeSlider.addEventListener("input", (e) => {
	penSize = e.target.value;
	penSizeDisplay.textContent = penSize;//ペンの表示サイズを変更
} )
/*
 *サムネイルクリックでSVGをメインキャンバスに描画
 */
document.querySelectorAll(".thumbnail").forEach(img => {
	withConfirmBeforeChange(img, () => {
		drawlineCanvas(img.dataset.lineid);
		paintCtx.clearRect(0,0,paintCanvas.width,paintCanvas.height);
		isPainted = false;
	});
});

function drawlineCanvas(lineId){
	//線画IDに対応するサムネイルを取得
	const targetImg = document.querySelector(`.thumbnail[data-lineId="${lineId}"]`);
	if (!targetImg){
		console.warn("対応する線画が見つかりません:",lineId);
		return;
	}
	//該当サムネイルの線画SVGパスを取得
	const svgPath = targetImg.dataset.src;
	
	const img = new Image();
	img.src = svgPath;
	
	//マスクが適用されている場合は解除する
	//paintCtx.restore();
	
	//画像読込完了時に実行(onload)
	img.onload = () => {
		let { width, height } = getCanvasSize();

		// キャンバスの内部サイズも更新
		lineCanvas.width = width;
		lineCanvas.height = height;
		paintCanvas.width = width;
		paintCanvas.height = height;

		// レイアウトが確定するまで待つ
		requestAnimationFrame(async () => {
		    // 再度サイズを取得（ここで正しい値になる）
		    ({ width, height } = getCanvasSize());

			//マスク適用
			const svgMaskPath = targetImg.dataset.mask;
			const maskPath = await getMaskPath(svgMaskPath);
			paintCtx.save();
			paintCtx.clip(maskPath);
			
		    // 画像の描画(描画画像(オブジェクト),描画開始X座標,描画開始Y座標,描画幅,描画高さ)
		    lineCtx.clearRect(0, 0, width, height);
		    lineCtx.drawImage(img, 0, 0, width, height);
		});
	}

	//現在の線画IDの設定
	currentLineId = lineId;
}

/*
 * 確認メッセージ＋OKクリック後処理
 */
function withConfirmBeforeChange(img, callback){
	img.addEventListener("click", () => {
		if (isPainted){
			const ok = confirm("現在の塗り絵は保存されません。続行しますか？");
			if (!ok) return;//キャンセルなら処理中断
		}
		callback();//OKの場合のみ処理実行
	});
}

// 塗り絵機能用変数初期化
let currentColor = "#ff0000";//選択色
let painting = false;//マウスでの描画のONOFF状態FLG
let lastX = 0;
let lastY = 0;
let lastPenColor = currentColor; // ペンに戻す用

//色設定
//colorクラスのdivをすべてループ処理
document.querySelectorAll(".color").forEach(c => {
  //divの背景色を、div自身に設定されたdata-colorにする
  c.style.background = c.dataset.color;
  //divがクリックされた場合の処理
  c.addEventListener("click", () => {
	//選択色として、クリックされたdivのdata-colorをセット
    currentColor = c.dataset.color;
  });
});

document.getElementById("color-picker").addEventListener("input", e => {
    currentColor = e.target.value;
});


const paintCanvas = document.getElementById("paint-canvas");
const paintCtx = paintCanvas.getContext("2d");
let isPainted = false//塗り絵があるかどうかのフラグ

//マウスの押し込みがされたら描画をON
paintCanvas.addEventListener("mousedown", (e) => {
	isPainted = true; //塗ったらフラグを立てる
	painting = true;
	//キャンバスの画面上の表示位置と大きさの座標
	const rect = paintCanvas.getBoundingClientRect();
	//ブラウザ画面全体に対する位置XY－キャンバスの左上座標＝キャンバス内のローカル座標を取得
	//※マウスクリック時点の座標を保持
	const displayX = e.clientX - rect.left;
	const displayY = e.clientY - rect.top;

	const scaleX = paintCanvas.width / rect.width;
	const scaleY = paintCanvas.height / rect.height;

	lastX = displayX * scaleX;
	lastY = displayY * scaleY;

});

//マウスのクリックが離されたら描画をOFF
paintCanvas.addEventListener("mouseup", () => painting = false);
//マウスがキャンバス外にでたら描画をOFF
paintCanvas.addEventListener("mouseleave", () => painting = false);

/*
 * キャンバスでマウスが動いたら処理を行う
 */
paintCanvas.addEventListener("mousemove", (e) => {
  //描画のONOFFFLGを確認し、マウスが押し込まれていないときは処理を抜ける
  if (!painting) return;

  //キャンバスの画面上の表示位置と大きさの座標
  const rect = paintCanvas.getBoundingClientRect();
  //ブラウザ画面全体に対する位置XY－キャンバスの左上座標＝キャンバス内のローカル座標を取得
  const displayX = e.clientX - rect.left;
  const displayY = e.clientY - rect.top;

  // 内部サイズ
  const scaleX = paintCanvas.width / rect.width;
  const scaleY = paintCanvas.height / rect.height;

  // 内部座標に変換
  const x = displayX * scaleX;
  const y = displayY * scaleY;

  //描画色を選択色にする
  paintCtx.strokeStyle = currentColor;
  paintCtx.lineWidth = penSize; //ペンの太さ
  paintCtx.lineCap = "round"; //先端を丸く
  paintCtx.lineJoin = "round";//角をなめらかにする
  
  paintCtx.beginPath();
  paintCtx.moveTo(lastX, lastY);
  paintCtx.lineTo(x,y);
  paintCtx.stroke();
  
  lastX = x;
  lastY = y;
});

/*
 *マスクを適用する
 */
async function getMaskPath(maskFilePath){
    const res = await fetch(maskFilePath);
    const svgText = await res.text();

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, "image/svg+xml");

    const maskPathElement = svgDoc.getElementById("mask-area");
    const d = maskPathElement.getAttribute("d");

    const originalPath = new Path2D(d);

    const { width, height } = getCanvasSize();
    const scaleX = width / 400;
    const scaleY = height / 400;

    const scaledPath = new Path2D();
    scaledPath.addPath(originalPath, new DOMMatrix().scale(scaleX, scaleY));

    return scaledPath; // ← これが await で受け取れる
}
/*
 *ダウンロードボタン押下
 */
document.getElementById("dl-btn").addEventListener("click",() => {
	downloadPainting();
})

/*
 *保存ボタン押下
 */
document.getElementById("save-btn").addEventListener("click",() => {
	//塗りCanvasデータを文字列に変換
	const dataUrl = paintCanvas.toDataURL("image/png");
	// 未ログインならログイン画面へ誘導
	if (!isLoggedIn) {
		// キャンバス画像を保存
		localStorage.setItem("pendingImageData", dataUrl);
		localStorage.setItem("pendingLineId", currentLineId);

	    if (confirm("保存するにはログインが必要です。ログインしますか？")) {
	        window.location.href = "/login"; // Spring Security のデフォルトログインURL
	    }
	    return; // 保存処理は実行しない
	}
	// ログイン済みなら保存処理へ
	savePainting(dataUrl);
});
 
/*
 *塗り絵画像のダウンロード
 */
function downloadPainting(){
	//合成用の一時Canvasを作成
	const mergedCanvas = document.createElement("canvas");//Canvas要素の作成
	mergedCanvas.width = paintCanvas.width;
	mergedCanvas.height = paintCanvas.height;
	const mergedCtx = mergedCanvas.getContext("2d");//一時キャンバスのペンを取得
	
	//背景を白で塗る
	mergedCtx.fillStyle = "#ffffff";
	mergedCtx.fillRect(0,0,mergedCanvas.width,mergedCanvas.height);//(左上のx座標,左上のy座標,幅,高さ)
	
	//塗りCanvasを合成
	mergedCtx.drawImage(paintCanvas,0,0);//drawImage(指定画像,貼り付け座標(左上のx座標),貼り付け座標(左上のy座標))
	
	//線画Canvasを合成
	mergedCtx.drawImage(lineCanvas,0,0);
	
	//PNGとして保存
	const link = document.createElement("a");//アンカータグでリンク要素を作成
	link.download = "coloring.png";//ダウンロード時の保存ファイル名
	link.href = mergedCanvas.toDataURL("image/png");//PNG用の文字列に変換した塗りCanvasをリンクにセット
	link.click();//リンク自動クリック
}
/*
 *データ保存
 */
function savePainting(dataUrl){

	//CSRFトークンをmetaタグより取得
	const token = document.querySelector('meta[name="_csrf"]').content;
	const header = document.querySelector('meta[name="_csrf_header"]').content;

	//指定URLにHTTPリクエストを送る
	fetch("/design/save",{
		method: "POST",
		headers: {"Content-Type": "application/json",//JSON形式を指定
			[header]: token
		}, 
		body: JSON.stringify({ //サーバーに送るデータ指定
			imageData: dataUrl, //文字列をJSON形式に変換
			lineId: currentLineId //線画ID
		})
	})
	.then(res => res.json()) //サーバーから返却されたRESをJSONとして読み込む
	.then(data => { //上記のJSONデータをdataとして受け取る→dataは未使用
		alert("保存しました");
		isPainted = false;
		//サムネイルだけ再読み込み
		if (isLoggedIn) {
		reloadUserThumbnails();
		}
	});
}

/*
 * サムネイル部分だけ再取得（Ajax）
 */
async function reloadUserThumbnails() {
    const res = await fetch("/design/user-thumbnails");
    const html = await res.text();
	// 差し替え先
    const container = document.querySelector("#user-thumbnails-area");
	if (!container) return; 
    container.innerHTML = html;

    // ★ 再描画後にイベントを再付与
    attachThumbnailEvents();
}
/*
 * サムネイルイベント再付与
 */
function attachThumbnailEvents() {
	/*
	 * サムネイル選択時の削除ボタン表示
	 */
	document.querySelectorAll(".thumb-wrapper").forEach(wrapper => {
	    wrapper.addEventListener("click", (e) => {

	        // 削除ボタンのクリックは別処理にする
	        if (e.target.classList.contains("delete-btn")) return;

	        // 既存の選択を解除
	        if (selectedThumb) {
	            selectedThumb.classList.remove("selected");
	        }

	        // 新しい選択
	        wrapper.classList.add("selected");
	        selectedThumb = wrapper;
	    });
	});
	/*
	 * 削除ボタン押下イベント
	 */
	document.querySelectorAll(".delete-btn").forEach(btn => {
	    btn.addEventListener("click", async (e) => {
	        e.stopPropagation(); // 親のクリックイベントを無効化

	        const id = btn.dataset.id;

	        if (!confirm("この塗り絵を削除しますか？")) return;

	        const token = document.querySelector('meta[name="_csrf"]').content;
	        const header = document.querySelector('meta[name="_csrf_header"]').content;

	        const res = await fetch("/design/delete", {
	            method: "POST",
	            headers: {
	                "Content-Type": "application/json",
	                [header]: token
	            },
	            body: JSON.stringify({ id: id })
	        });

	        const result = await res.json();
	        if (result.status === "ok") {
	            alert("削除しました");
				if (isLoggedIn) {
				reloadUserThumbnails();
				}// 再読み込みでサムネイル更新
	        }
	    });
	});
	/*
	 * 保存済み塗り絵のサムネイルクリック時にメインキャンバスに描画
	 */
	document.querySelectorAll(".thumb-paint").forEach(img => {
		withConfirmBeforeChange(img, () => {
			const dataUrl = img.dataset.paint;
			const loadedImg = new Image();
			loadedImg.src = dataUrl;
			
			loadedImg.onload = async () => {

				// ★ キャンバスの表示サイズを取得
				const { width, height } = getCanvasSize();
				// ★ 塗りキャンバスをクリア
				//paintCtx.clearRect(0, 0, width, height);

				await drawlineCanvas(img.dataset.lineid);
			
				// ★ 内部サイズを更新（線画と同じ）
				paintCanvas.width = width;
				paintCanvas.height = height;

				// ★ マスクパスを取得
				const maskPath = await getMaskPath(
				    document.querySelector(`.thumbnail[data-lineid="${img.dataset.lineid}"]`).dataset.mask
				);

				// ★ 塗り絵をマスク内に描画
				paintCtx.save();
				paintCtx.clip(maskPath);
				paintCtx.drawImage(loadedImg, 0, 0, width, height);

			}
			isPainted = false;
		});
	});
}
/*
 * キャンバスの実サイズを CSS から取得
 */
function getCanvasSize() {
	const rect = document.querySelector(".canvas-area").getBoundingClientRect();
	return { width: rect.width, height: rect.height };
}

const cursorCircle = document.getElementById("cursor-circle");
const canvasArea = document.querySelector(".canvas-area");

// キャンバス上に入ったら表示
canvasArea.addEventListener("mouseenter", () => {
    cursorCircle.style.display = "block";
});

// キャンバスから出たら非表示
canvasArea.addEventListener("mouseleave", () => {
    cursorCircle.style.display = "none";
});

// マウス移動でカーソルを追従
canvasArea.addEventListener("mousemove", (e) => {
    const rect = canvasArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cursorCircle.style.left = `${x}px`;
    cursorCircle.style.top = `${y}px`;
});
penSizeSlider.addEventListener("input", () => {
    updateCursorCircle();
});
document.querySelectorAll(".color").forEach(c => {
    c.addEventListener("click", () => {
        currentColor = c.dataset.color;
        updateCursorCircle();
    });
});

document.getElementById("color-picker").addEventListener("input", e => {
    currentColor = e.target.value;
    updateCursorCircle();
});
function updateCursorCircle() {
    cursorCircle.style.width = `${penSize}px`;
    cursorCircle.style.height = `${penSize}px`;
    cursorCircle.style.borderColor = currentColor;
}
/*
 * 消しゴムボタンイベント
 */
document.getElementById("eraser-btn").addEventListener("click", () => {
    lastPenColor = currentColor;   // 今の色を保存
    currentColor = "#ffffff";      // 消しゴムは白
    updateCursorCircle();          // カーソルも白
});
/*
 * ペンに戻すイベント
 */
document.getElementById("pen-btn").addEventListener("click", () => {
    currentColor = lastPenColor;   // 元の色に戻す
    updateCursorCircle();          // カーソルも元の色
});



//スマホ対応　描画開始
paintCanvas.addEventListener("touchstart", (e) => {
    e.preventDefault(); // スクロール防止

    isPainted = true;
    painting = true;

    const rect = paintCanvas.getBoundingClientRect();
    const touch = e.touches[0];

    const displayX = touch.clientX - rect.left;
    const displayY = touch.clientY - rect.top;

    const scaleX = paintCanvas.width / rect.width;
    const scaleY = paintCanvas.height / rect.height;

    lastX = displayX * scaleX;
    lastY = displayY * scaleY;
});
//描画中
paintCanvas.addEventListener("touchmove", (e) => {
    e.preventDefault(); // スクロール防止
    if (!painting) return;

    const rect = paintCanvas.getBoundingClientRect();
    const touch = e.touches[0];

    const displayX = touch.clientX - rect.left;
    const displayY = touch.clientY - rect.top;

    const scaleX = paintCanvas.width / rect.width;
    const scaleY = paintCanvas.height / rect.height;

    const x = displayX * scaleX;
    const y = displayY * scaleY;

    paintCtx.strokeStyle = currentColor;
    paintCtx.lineWidth = penSize;
    paintCtx.lineCap = "round";
    paintCtx.lineJoin = "round";

    paintCtx.beginPath();
    paintCtx.moveTo(lastX, lastY);
    paintCtx.lineTo(x, y);
    paintCtx.stroke();

    lastX = x;
    lastY = y;
});
//描画終了
paintCanvas.addEventListener("touchend", () => {
    painting = false;
});

paintCanvas.addEventListener("touchcancel", () => {
    painting = false;
});